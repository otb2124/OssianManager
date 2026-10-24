use serde_json::Value;
use tauri::{AppHandle, State, Window};

use super::Engine;
use crate::error::AppResult;

#[tauri::command]
pub fn spawn_engine_process(
    app: AppHandle,
    window: Window,
    engine: State<'_, Engine>,
    exe_path: String,
) -> AppResult<()> {
    engine.spawn(app, &window, &exe_path)
}

#[tauri::command]
pub fn set_engine_visibility(window: Window, engine: State<'_, Engine>, visible: bool) {
    engine
        .viewport
        .set_visible(visible, window.scale_factor().unwrap_or(1.0));
}

#[tauri::command]
pub fn update_viewport_bounds(
    window: Window,
    engine: State<'_, Engine>,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) {
    engine
        .viewport
        .set_bounds(x, y, width, height, window.scale_factor().unwrap_or(1.0));
}

#[tauri::command]
pub async fn engine_request(
    engine: State<'_, Engine>,
    method: String,
    params: Option<Value>,
) -> AppResult<Value> {
    engine.link.request(method, params).await
}

#[tauri::command]
pub fn engine_console_write(engine: State<'_, Engine>, line: String) -> AppResult<()> {
    engine.console.write(&line)
}