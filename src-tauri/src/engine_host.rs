use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::os::windows::io::AsRawHandle;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicPtr, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
use winapi::shared::windef::{HWND, POINT, RECT};
#[cfg(target_os = "windows")]
use winapi::um::jobapi2::{AssignProcessToJobObject, CreateJobObjectW, SetInformationJobObject};
#[cfg(target_os = "windows")]
use winapi::um::winnt::{
    JobObjectExtendedLimitInformation, HANDLE, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};
#[cfg(target_os = "windows")]
use winapi::um::winuser::{
    ClientToScreen, EnumWindows, GetForegroundWindow, GetWindowLongPtrA, GetWindowRect,
    GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible, SetForegroundWindow,
    SetWindowLongPtrA, SetWindowPos, ShowWindow, GWL_EXSTYLE, GWL_STYLE, GWLP_HWNDPARENT,
    HWND_TOP, SW_HIDE, SW_SHOW, SW_SHOWNA, SWP_FRAMECHANGED, SWP_HIDEWINDOW, SWP_NOACTIVATE,
    SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_SHOWWINDOW, WS_CAPTION, WS_EX_LAYERED,
    WS_EX_TRANSPARENT, WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
    WS_VISIBLE,
};

static ENGINE_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static PARENT_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static ENGINE_VISIBLE: AtomicBool = AtomicBool::new(false);

// The running engine process, so a respawn can replace it instead of leaving a second one behind.
static ENGINE_CHILD: Mutex<Option<Child>> = Mutex::new(None);

// Job object with KILL_ON_JOB_CLOSE. Created once and never closed on purpose: Windows closes the
// handle when the manager process ends (closed, crashed, restarted by `cargo run`), which kills the
// engine and anything it spawned. Stored as usize because raw pointers aren't Sync.
#[cfg(target_os = "windows")]
static ENGINE_JOB: std::sync::OnceLock<usize> = std::sync::OnceLock::new();

#[cfg(target_os = "windows")]
fn engine_job() -> Option<HANDLE> {
    let raw = *ENGINE_JOB.get_or_init(|| unsafe {
        let job = CreateJobObjectW(std::ptr::null_mut(), std::ptr::null());
        if job.is_null() {
            return 0;
        }
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        let ok = SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &mut info as *mut _ as *mut _,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        );
        if ok == 0 { 0 } else { job as usize }
    });
    if raw == 0 { None } else { Some(raw as HANDLE) }
}

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
                ShowWindow(hwnd, SW_SHOWNA); // was SW_SHOW, which activates the window
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
pub fn spawn_engine_process(
    app: tauri::AppHandle,
    window: tauri::Window,
    exe_path: String,
) -> Result<(), String> {
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

    // Replace a previous engine (e.g. after a webview reload) instead of leaving it running.
    if let Some(mut old) = ENGINE_CHILD.lock().unwrap().take() {
        let _ = old.kill();
        let _ = old.wait();
    }
    crate::engine_console::detach();
    ENGINE_HWND.store(std::ptr::null_mut(), Ordering::SeqCst);
    APPLIED_SCREEN_X.store(-1, Ordering::SeqCst);
    APPLIED_SCREEN_Y.store(-1, Ordering::SeqCst);
    APPLIED_W.store(-1, Ordering::SeqCst);
    APPLIED_H.store(-1, Ordering::SeqCst);

    let pipe_name = crate::engine_link::new_pipe_name();
    let server = crate::engine_link::create_server(&pipe_name)
        .map_err(|e| format!("Failed to create engine pipe: {}", e))?;

    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    let mut child = Command::new(&path)
        .arg("--embedded")
        .arg("--pipe")
        .arg(&pipe_name)
        .current_dir(exe_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)   // engine still gets a (hidden) console, so stdout/Console.WriteLine keep working
        .spawn()
        .map_err(|e| format!("Failed to launch process: {}", e))?;

    #[cfg(target_os = "windows")]
    if let Some(job) = engine_job() {
        unsafe {
            AssignProcessToJobObject(job, child.as_raw_handle() as HANDLE);
        }
    }

    crate::engine_console::attach(&app, &mut child);
    crate::engine_link::start(app, server);

    let pid = child.id();
    *ENGINE_CHILD.lock().unwrap() = Some(child);

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
        let thread_window = window.clone();

        thread::spawn(move || {
            let start = Instant::now();
            let timeout = Duration::from_secs(60); // engine load (Roslyn etc.) can be slow
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

                        // Apply the style change and hide, without activating.
                        SetWindowPos(
                            child_hwnd,
                            std::ptr::null_mut(),
                            0, 0, 0, 0,
                            SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER
                                | SWP_NOACTIVATE | SWP_HIDEWINDOW,
                        );
                        ENGINE_HWND.store(child_hwnd as *mut _, Ordering::SeqCst);

                        // The engine grabs foreground while creating its window: give it back.
                        let fg = GetForegroundWindow();
                        if !fg.is_null() {
                            let mut fg_pid = 0;
                            GetWindowThreadProcessId(fg, &mut fg_pid);
                            if fg_pid == pid {
                                SetForegroundWindow(parent_hwnd);
                            }
                        }

                        // The viewport may have asked to be visible while the engine was
                        // still loading. Apply that now instead of waiting for a tab switch.
                        APPLIED_SCREEN_X.store(-1, Ordering::SeqCst);
                        APPLIED_SCREEN_Y.store(-1, Ordering::SeqCst);
                        APPLIED_W.store(-1, Ordering::SeqCst);
                        APPLIED_H.store(-1, Ordering::SeqCst);
                        apply_bounds(thread_window.scale_factor().unwrap_or(1.0));

                        println!("[Rust] C# Engine ready");
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

/// Kills the running engine and clears per-engine window state. Used before a respawn.
fn stop_engine() {
    if let Some(mut old) = ENGINE_CHILD.lock().unwrap().take() {
        let _ = old.kill();
        let _ = old.wait();
    }
    crate::engine_console::detach();
    ENGINE_HWND.store(std::ptr::null_mut(), Ordering::SeqCst);
    APPLIED_SCREEN_X.store(-1, Ordering::SeqCst);
    APPLIED_SCREEN_Y.store(-1, Ordering::SeqCst);
    APPLIED_W.store(-1, Ordering::SeqCst);
    APPLIED_H.store(-1, Ordering::SeqCst);
}

/// Editor window is gone: stop the engine and forget the destroyed parent window.
pub fn shutdown_engine() {
    stop_engine();
    PARENT_HWND.store(std::ptr::null_mut(), Ordering::SeqCst);
    ENGINE_VISIBLE.store(false, Ordering::SeqCst);
}