use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicPtr, Ordering};
use std::thread;
use std::time::{Duration, Instant};

#[cfg(target_os = "windows")]
use winapi::shared::windef::{HWND, POINT, RECT};
#[cfg(target_os = "windows")]
use winapi::um::winuser::{
    ClientToScreen, EnumWindows, GetWindowLongPtrA, GetWindowRect, GetWindowTextW,
    GetWindowThreadProcessId, IsWindowVisible, SetWindowLongPtrA, SetWindowPos, ShowWindow,
    GWL_EXSTYLE, GWL_STYLE, GWLP_HWNDPARENT, HWND_TOP, SW_HIDE, SW_SHOW, SWP_FRAMECHANGED,
    SWP_HIDEWINDOW, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW, WS_CAPTION,
    WS_EX_LAYERED, WS_EX_TRANSPARENT, WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU,
    WS_THICKFRAME, WS_VISIBLE,
};

static ENGINE_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static PARENT_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static ENGINE_VISIBLE: AtomicBool = AtomicBool::new(false);

static LAST_X: AtomicI32 = AtomicI32::new(0);
static LAST_Y: AtomicI32 = AtomicI32::new(0);
static LAST_W: AtomicI32 = AtomicI32::new(0);
static LAST_H: AtomicI32 = AtomicI32::new(0);

static APPLIED_SCREEN_X: AtomicI32 = AtomicI32::new(-1);
static APPLIED_SCREEN_Y: AtomicI32 = AtomicI32::new(-1);
static APPLIED_W: AtomicI32 = AtomicI32::new(-1);
static APPLIED_H: AtomicI32 = AtomicI32::new(-1);

struct FindWindowData {
    process_id: u32,
    hwnd: Option<HWND>,
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_windows_callback(hwnd: HWND, lparam: isize) -> i32 {
    let data = &mut *(lparam as *mut FindWindowData);
    let mut pid = 0;
    GetWindowThreadProcessId(hwnd, &mut pid);

    if pid == data.process_id {
        let mut rect = RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        GetWindowRect(hwnd, &mut rect);
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), 512);
        let title = OsString::from_wide(&buffer[..len as usize])
            .to_string_lossy()
            .into_owned();

        if IsWindowVisible(hwnd) != 0 && width > 50 && height > 50 {
            data.hwnd = Some(hwnd);
            return 0;
        }
    }
    1
}

pub fn apply_bounds(scale_factor: f64) {
    #[cfg(target_os = "windows")]
    unsafe {
        let hwnd = ENGINE_HWND.load(Ordering::SeqCst) as HWND;
        let parent_hwnd = PARENT_HWND.load(Ordering::SeqCst) as HWND;

        if hwnd.is_null() || parent_hwnd.is_null() {
            return;
        }

        if !ENGINE_VISIBLE.load(Ordering::SeqCst) {
            ShowWindow(hwnd, SW_HIDE);
            return;
        }

        let x = LAST_X.load(Ordering::SeqCst);
        let y = LAST_Y.load(Ordering::SeqCst);
        let w = LAST_W.load(Ordering::SeqCst);
        let h = LAST_H.load(Ordering::SeqCst);

        if w > 0 && h > 0 {
            let scaled_x = (x as f64 * scale_factor) as i32;
            let scaled_y = (y as f64 * scale_factor) as i32;
            let scaled_w = (w as f64 * scale_factor) as i32;
            let scaled_h = (h as f64 * scale_factor) as i32;

            let mut pt = POINT {
                x: scaled_x,
                y: scaled_y,
            };
            ClientToScreen(parent_hwnd, &mut pt);

            if APPLIED_SCREEN_X.load(Ordering::SeqCst) == pt.x
                && APPLIED_SCREEN_Y.load(Ordering::SeqCst) == pt.y
                && APPLIED_W.load(Ordering::SeqCst) == scaled_w
                && APPLIED_H.load(Ordering::SeqCst) == scaled_h
            {
                ShowWindow(hwnd, SW_SHOW);
                return;
            }

            APPLIED_SCREEN_X.store(pt.x, Ordering::SeqCst);
            APPLIED_SCREEN_Y.store(pt.y, Ordering::SeqCst);
            APPLIED_W.store(scaled_w, Ordering::SeqCst);
            APPLIED_H.store(scaled_h, Ordering::SeqCst);

            SetWindowPos(
                hwnd,
                HWND_TOP,
                pt.x,
                pt.y,
                scaled_w,
                scaled_h,
                SWP_NOACTIVATE | SWP_SHOWWINDOW,
            );
        }
    }
}

#[tauri::command]
pub fn spawn_engine_process(window: tauri::Window, exe_path: String) -> Result<(), String> {
    println!("[Rust] Spawning C# engine process at startup: {}", exe_path);

    let mut path = PathBuf::from(&exe_path);

    if path.is_dir() {
        path = path.join("OssianEngine.exe"); 
    }

    if !path.exists() || !path.is_file() {
        return Err(format!("Engine executable not found at path: {}", path.display()));
    }

    let exe_dir = path
        .parent()
        .ok_or_else(|| "Failed to get executable directory".to_string())?;

    let child = Command::new(&path)
        .arg("--embedded")
        .current_dir(exe_dir)
        .spawn()
        .map_err(|e| format!("Failed to launch process: {}", e))?;

    let pid = child.id();

    let move_window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Moved(_) = event {
            let scale = move_window_clone.scale_factor().unwrap_or(1.0);
            apply_bounds(scale);
        }
    });

    #[cfg(target_os = "windows")]
    {
        let tauri_hwnd = window.hwnd().map_err(|e| e.to_string())?.0;
        let tauri_hwnd_usize = tauri_hwnd as usize;

        thread::spawn(move || {
            let start = Instant::now();
            let timeout = Duration::from_secs(10);
            let parent_hwnd = tauri_hwnd_usize as HWND;

            while start.elapsed() < timeout {
                let mut data = FindWindowData {
                    process_id: pid,
                    hwnd: None,
                };

                unsafe {
                    EnumWindows(
                        Some(enum_windows_callback),
                        &mut data as *mut FindWindowData as isize,
                    );

                    if let Some(child_hwnd) = data.hwnd {
                        PARENT_HWND.store(parent_hwnd as *mut _, Ordering::SeqCst);

                        let old_style = GetWindowLongPtrA(child_hwnd, GWL_STYLE);
                        let strip_styles = (WS_CAPTION
                            | WS_THICKFRAME
                            | WS_MINIMIZEBOX
                            | WS_MAXIMIZEBOX
                            | WS_SYSMENU) as isize;
                        let new_style = (old_style & !strip_styles) | (WS_POPUP) as isize;
                        SetWindowLongPtrA(child_hwnd, GWL_STYLE, new_style);

                        let old_exstyle = GetWindowLongPtrA(child_hwnd, GWL_EXSTYLE);
                        let new_exstyle =
                            old_exstyle & !(WS_EX_LAYERED as isize | WS_EX_TRANSPARENT as isize);
                        SetWindowLongPtrA(child_hwnd, GWL_EXSTYLE, new_exstyle);

                        SetWindowLongPtrA(child_hwnd, GWLP_HWNDPARENT, parent_hwnd as isize);
                        ENGINE_HWND.store(child_hwnd as *mut _, Ordering::SeqCst);

                        ShowWindow(child_hwnd, SW_HIDE);
                        println!("[Rust] C# Engine ready (background idle)");
                        break;
                    }
                }
                thread::sleep(Duration::from_millis(200));
            }
        });
    }

    Ok(())
}

#[tauri::command]
pub fn set_engine_visibility(window: tauri::Window, visible: bool) {
    ENGINE_VISIBLE.store(visible, Ordering::SeqCst);
    let scale = window.scale_factor().unwrap_or(1.0);
    apply_bounds(scale);
}

#[tauri::command]
pub fn update_viewport_bounds(window: tauri::Window, x: i32, y: i32, width: i32, height: i32) {
    LAST_X.store(x, Ordering::SeqCst);
    LAST_Y.store(y, Ordering::SeqCst);
    LAST_W.store(width, Ordering::SeqCst);
    LAST_H.store(height, Ordering::SeqCst);

    let scale = window.scale_factor().unwrap_or(1.0);
    apply_bounds(scale);
}