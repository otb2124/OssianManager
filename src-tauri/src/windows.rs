use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const LAUNCHER: &str = "launcher";
pub const EDITOR: &str = "editor";

#[tauri::command]
pub async fn open_editor(app: AppHandle, project_id: String) -> Result<(), String> {
    // One editor at a time: if it exists, just focus it.
    if let Some(existing) = app.get_webview_window(EDITOR) {
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let id_js = serde_json::to_string(&project_id).map_err(|e| e.to_string())?;

    let _editor = WebviewWindowBuilder::new(&app, EDITOR, WebviewUrl::App("index.html".into()))
        .title("Ossian Manager")
        .inner_size(1600.0, 900.0)
        .maximized(true)
        .initialization_script(&format!("window.__OSSIAN_PROJECT_ID__ = {id_js};"))
        .build()
        .map_err(|e| e.to_string())?;

    #[cfg(debug_assertions)]
    _editor.open_devtools();

    if let Some(launcher) = app.get_webview_window(LAUNCHER) {
        launcher.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn close_editor(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window(EDITOR) {
        w.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Called from the global window-event handler when the editor window is destroyed.
pub fn on_editor_destroyed(app: &AppHandle) {
    crate::engine_host::shutdown_engine();
    if let Some(l) = app.get_webview_window(LAUNCHER) {
        let _ = l.show();
        let _ = l.set_focus();
    }
}