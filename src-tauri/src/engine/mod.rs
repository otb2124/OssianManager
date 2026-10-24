//! The embedded engine: one facade (`Engine`) over four collaborators.
//!   EngineProcess  – child process + kill-on-close job
//!   ConsoleBridge  – engine stdin/stdout/stderr <-> webview
//!   EngineLink     – named-pipe JSON protocol
//!   Viewport       – Win32 embedding of the engine window (Windows only, like before)

pub mod commands;
mod console;
mod link;
pub mod location;
mod process;
mod viewport;

use crate::error::{AppError, AppResult};
use console::ConsoleBridge;
use link::EngineLink;
use process::EngineProcess;
pub use viewport::Viewport;

pub const ENGINE_EXE: &str = "OssianForge.exe";

#[derive(Clone, Default)]
pub struct Engine {
    process: EngineProcess,
    console: ConsoleBridge,
    link: EngineLink,
    viewport: Viewport,
}

impl Engine {
    pub fn viewport(&self) -> &Viewport {
        &self.viewport
    }

    /// Replaces any running engine with a new one built from `exe_path` (exe or folder).
    pub fn spawn(&self, app: tauri::AppHandle, window: &tauri::Window, exe_path: &str) -> AppResult<()> {
        let (_, exe) = location::resolve_engine(exe_path)?;
        let parent = window.hwnd().map_err(|e| AppError::msg(e.to_string()))?.0 as usize;

        self.stop();

        // The server end must exist BEFORE the engine starts, so its connect can't race us.
        let pipe = link::new_pipe_name();
        let server = link::create_server(&pipe)
            .map_err(|e| AppError::msg(format!("Failed to create engine pipe: {e}")))?;

        let mut child = self.process.spawn(&exe, &pipe)?;
        self.console.attach(&app, &mut child);
        self.link.start(app, server);
        let (pid, generation) = self.process.install(child);

        let process = self.process.clone();
        let scale_window = window.clone();
        self.viewport.embed_when_ready(
            parent,
            pid,
            move || scale_window.scale_factor().unwrap_or(1.0),
            move || process.is_current(generation),
        );
        Ok(())
    }

    /// Kills the engine and clears per-engine state (used before a respawn).
    pub fn stop(&self) {
        self.process.stop();
        self.console.detach();
        self.viewport.reset();
    }

    /// The editor window is gone: stop the engine and forget the destroyed parent.
    pub fn shutdown(&self) {
        self.stop();
        self.viewport.shutdown();
    }
}