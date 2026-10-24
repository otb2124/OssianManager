//! Embeds the engine's native window into the editor window and keeps it aligned with the
//! Angular viewport panel. All Win32 code lives here.

use std::ptr;
use std::sync::{Arc, Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant};

use winapi::shared::windef::{HWND, POINT, RECT};
use winapi::um::winuser::{
    ClientToScreen, EnumWindows, GetForegroundWindow, GetWindowLongPtrA, GetWindowRect,
    GetWindowThreadProcessId, IsWindowVisible, SetForegroundWindow, SetWindowLongPtrA,
    SetWindowPos, ShowWindow, GWLP_HWNDPARENT, GWL_EXSTYLE, GWL_STYLE, HWND_TOP, SWP_FRAMECHANGED,
    SWP_HIDEWINDOW, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_SHOWWINDOW,
    SW_HIDE, SW_SHOWNA, WS_CAPTION, WS_EX_LAYERED, WS_EX_TRANSPARENT, WS_MAXIMIZEBOX,
    WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
};

const EMBED_TIMEOUT: Duration = Duration::from_secs(60); // engine load (Roslyn etc.) can be slow
const EMBED_POLL: Duration = Duration::from_millis(200);
const MIN_WINDOW_SIZE: i32 = 50;

#[derive(Clone, Copy, Default, PartialEq, Eq)]
struct Bounds {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
}

#[derive(Default)]
struct State {
    engine_hwnd: usize,
    parent_hwnd: usize,
    visible: bool,
    /// Last bounds requested by the webview (CSS px).
    requested: Bounds,
    /// Last bounds actually applied (screen px); skips redundant SetWindowPos calls.
    applied: Option<Bounds>,
}

#[derive(Clone, Default)]
pub struct Viewport(Arc<Mutex<State>>);

impl Viewport {
    fn lock(&self) -> MutexGuard<'_, State> {
        self.0.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn set_visible(&self, visible: bool, scale: f64) {
        self.lock().visible = visible;
        self.apply(scale);
    }

    pub fn set_bounds(&self, x: i32, y: i32, w: i32, h: i32, scale: f64) {
        self.lock().requested = Bounds { x, y, w, h };
        self.apply(scale);
    }

    /// A new engine is about to start: forget the old window.
    pub fn reset(&self) {
        let mut s = self.lock();
        s.engine_hwnd = 0;
        s.applied = None;
    }

    /// The parent window is destroyed.
    pub fn shutdown(&self) {
        self.reset();
        let mut s = self.lock();
        s.parent_hwnd = 0;
        s.visible = false;
    }

    pub fn apply(&self, scale: f64) {
        let (engine, parent, visible, req) = {
            let s = self.lock();
            (s.engine_hwnd, s.parent_hwnd, s.visible, s.requested)
        };
        if engine == 0 || parent == 0 {
            return;
        }
        let hwnd = engine as HWND;

        unsafe {
            if !visible {
                ShowWindow(hwnd, SW_HIDE);
                return;
            }
            if req.w <= 0 || req.h <= 0 {
                return;
            }

            let mut pt = POINT {
                x: (req.x as f64 * scale) as i32,
                y: (req.y as f64 * scale) as i32,
            };
            ClientToScreen(parent as HWND, &mut pt);
            let target = Bounds {
                x: pt.x,
                y: pt.y,
                w: (req.w as f64 * scale) as i32,
                h: (req.h as f64 * scale) as i32,
            };

            let unchanged = {
                let mut s = self.lock();
                let same = s.applied == Some(target);
                s.applied = Some(target);
                same
            };
            if unchanged {
                ShowWindow(hwnd, SW_SHOWNA); // SW_SHOW would activate the window
                return;
            }

            SetWindowPos(
                hwnd,
                HWND_TOP,
                target.x,
                target.y,
                target.w,
                target.h,
                SWP_NOACTIVATE | SWP_SHOWWINDOW,
            );
        }
    }

    /// Polls for the engine's top-level window, reparents it into `parent` and applies the bounds.
    /// Gives up after a timeout or once `still_current` turns false (the engine was replaced).
    pub fn embed_when_ready<S, C>(&self, parent: usize, pid: u32, scale: S, still_current: C)
    where
        S: Fn() -> f64 + Send + 'static,
        C: Fn() -> bool + Send + 'static,
    {
        let viewport = self.clone();
        thread::spawn(move || {
            let start = Instant::now();
            while start.elapsed() < EMBED_TIMEOUT && still_current() {
                if let Some(child) = find_engine_window(pid) {
                    viewport.embed(child, parent, pid);
                    viewport.apply(scale());
                    println!("[Rust] C# Engine ready");
                    return;
                }
                thread::sleep(EMBED_POLL);
            }
        });
    }

    fn embed(&self, child: HWND, parent: usize, pid: u32) {
        let parent_hwnd = parent as HWND;
        self.lock().parent_hwnd = parent;

        unsafe {
            let strip = (WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU) as isize;
            let style = GetWindowLongPtrA(child, GWL_STYLE);
            SetWindowLongPtrA(child, GWL_STYLE, (style & !strip) | WS_POPUP as isize);

            let ex = GetWindowLongPtrA(child, GWL_EXSTYLE);
            SetWindowLongPtrA(
                child,
                GWL_EXSTYLE,
                ex & !(WS_EX_LAYERED as isize | WS_EX_TRANSPARENT as isize),
            );
            SetWindowLongPtrA(child, GWLP_HWNDPARENT, parent_hwnd as isize);

            // Apply the style change and hide, without activating.
            SetWindowPos(
                child,
                ptr::null_mut(),
                0,
                0,
                0,
                0,
                SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_HIDEWINDOW,
            );

            {
                let mut s = self.lock();
                s.engine_hwnd = child as usize;
                s.applied = None; // the viewport may already want to be visible: apply() shows it
            }

            // The engine grabs foreground while creating its window: give it back.
            let fg = GetForegroundWindow();
            if !fg.is_null() {
                let mut fg_pid = 0;
                GetWindowThreadProcessId(fg, &mut fg_pid);
                if fg_pid == pid {
                    SetForegroundWindow(parent_hwnd);
                }
            }
        }
    }
}

// ── window lookup ──────────────────────────────────────────────────────────

struct Search {
    pid: u32,
    found: Option<HWND>,
}

unsafe extern "system" fn on_window(hwnd: HWND, lparam: isize) -> i32 {
    let search = &mut *(lparam as *mut Search);

    let mut pid = 0;
    GetWindowThreadProcessId(hwnd, &mut pid);
    if pid != search.pid {
        return 1;
    }

    let mut rect = RECT { left: 0, top: 0, right: 0, bottom: 0 };
    GetWindowRect(hwnd, &mut rect);
    if IsWindowVisible(hwnd) != 0
        && rect.right - rect.left > MIN_WINDOW_SIZE
        && rect.bottom - rect.top > MIN_WINDOW_SIZE
    {
        search.found = Some(hwnd);
        return 0;
    }
    1
}

fn find_engine_window(pid: u32) -> Option<HWND> {
    let mut search = Search { pid, found: None };
    unsafe {
        EnumWindows(Some(on_window), &mut search as *mut Search as isize);
    }
    search.found
}