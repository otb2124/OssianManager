mod commands;
mod engine;
mod entry_info;
mod error;
mod services;
mod tools;
mod util;
mod windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(engine::Engine::default())
        .manage(tools::ToolRunner::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(windows::on_window_event)
        .invoke_handler(tauri::generate_handler![
            // config / files
            commands::fs::read_config,
            commands::fs::write_config,
            commands::fs::read_config_absolute,
            commands::fs::write_config_absolute,
            commands::fs::delete_directory,
            commands::fs::list_directory,
            commands::fs::rename_entry,
            commands::fs::ensure_directory,
            commands::fs::scan_for_projects,
            commands::fs::reveal_in_explorer,
            commands::git::get_latest_commit,
            entry_info::inspect_entry,
            entry_info::hash_file,
            entry_info::read_file_bytes,
            // engine
            engine::commands::spawn_engine_process,
            engine::commands::update_viewport_bounds,
            engine::commands::set_engine_visibility,
            engine::commands::engine_request,
            engine::commands::engine_console_write,
            // windows
            windows::open_editor,
            windows::close_editor,
            // cooker / builder
            tools::ossian_tools_layout,
            tools::run_ossian_tool,
            tools::cancel_ossian_tool,
            tools::launch_game,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}