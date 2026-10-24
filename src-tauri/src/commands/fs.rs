use std::path::Path;

use crate::error::AppResult;
use crate::services::files::{self, DirEntry};

#[tauri::command]
pub fn read_config(relative_path: String) -> AppResult<String> {
    files::read_text(&files::resolve_in_cwd(&relative_path)?)
}

#[tauri::command]
pub fn write_config(relative_path: String, content: String) -> AppResult<()> {
    files::write_text(&files::resolve_in_cwd(&relative_path)?, &content)
}

#[tauri::command]
pub fn read_config_absolute(path: String) -> AppResult<String> {
    files::read_text(Path::new(&path))
}

#[tauri::command]
pub fn write_config_absolute(path: String, content: String) -> AppResult<()> {
    files::write_text(Path::new(&path), &content)
}

#[tauri::command]
pub fn delete_directory(path: String) -> AppResult<()> {
    files::delete_directory(Path::new(&path))
}

#[tauri::command]
pub fn ensure_directory(path: String) -> AppResult<()> {
    files::ensure_directory(Path::new(&path))
}

#[tauri::command]
pub fn list_directory(path: String) -> AppResult<Vec<DirEntry>> {
    files::list_directory(Path::new(&path))
}

#[tauri::command]
pub fn rename_entry(old_path: String, new_name: String) -> AppResult<String> {
    files::rename_entry(Path::new(&old_path), &new_name)
        .map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn scan_for_projects(root: String) -> Vec<String> {
    files::scan_for_projects(Path::new(&root))
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) {
    files::reveal(&path);
}