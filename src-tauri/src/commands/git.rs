use crate::error::AppResult;
use crate::services::files::resolve_in_cwd;
use crate::services::git::{self, GitCommit};

#[tauri::command]
pub fn get_latest_commit(path: String) -> AppResult<GitCommit> {
    git::latest_commit(&resolve_in_cwd(&path)?)
}