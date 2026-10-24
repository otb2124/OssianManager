//! OssianTools (cook, build, ...) next to the engine:
//!   <engine dir>\OssianForge.exe
//!   <engine dir>\Ossian.ini
//!   <engine dir>\OssianTools\OssianTools.exe
//! Output is streamed to the webview as `tool://event`.

mod layout;
mod runner;

use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::{AppHandle, State};

use crate::engine::location::resolve_engine;
use crate::error::{AppError, AppResult};
pub use layout::ToolsLayout;
pub use runner::ToolRunner;

#[tauri::command]
pub fn ossian_tools_layout(engine_path: String) -> AppResult<ToolsLayout> {
    layout::resolve(&engine_path)
}

#[tauri::command]
pub fn run_ossian_tool(
    app: AppHandle,
    runner: State<'_, ToolRunner>,
    run_id: u64,
    engine_path: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> AppResult<()> {
    let (dir, _) = resolve_engine(&engine_path)?;

    // Only OssianTools next to the engine can be started from the webview, never an arbitrary exe.
    let exe = layout::tools_exe(&dir).ok_or_else(|| {
        AppError::msg(format!(
            "{} was not found under {}",
            layout::TOOLS_EXE,
            dir.join(layout::TOOLS_FOLDER).display()
        ))
    })?;

    let work_dir = cwd.map(PathBuf::from).unwrap_or_else(|| {
        exe.parent().map(Path::to_path_buf).unwrap_or_else(|| dir.clone())
    });

    runner.start(app, run_id, &exe, &args, &work_dir)
}

#[tauri::command]
pub fn cancel_ossian_tool(runner: State<'_, ToolRunner>, run_id: u64) -> bool {
    runner.cancel(run_id)
}

/// Starts a built game. Not tracked: the game outlives the manager.
#[tauri::command]
pub fn launch_game(exe_path: String) -> AppResult<()> {
    let exe = PathBuf::from(&exe_path);
    let is_exe = exe
        .extension()
        .and_then(|e| e.to_str())
        .map_or(false, |e| e.eq_ignore_ascii_case("exe"));

    if !exe.is_file() || !is_exe {
        return Err(AppError::msg(format!("'{exe_path}' is not an executable file")));
    }

    let dir = exe.parent().map(Path::to_path_buf).unwrap_or_default();
    Command::new(&exe)
        .current_dir(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| AppError::msg(format!("Failed to start {}: {e}", exe.display())))
}