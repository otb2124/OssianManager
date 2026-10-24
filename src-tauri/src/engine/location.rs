use std::path::{Path, PathBuf};

use super::ENGINE_EXE;
use crate::error::{AppError, AppResult};

/// `canonicalize` returns `\\?\C:\...` on Windows; the engine and the tools want plain paths.
fn strip_verbatim(p: PathBuf) -> PathBuf {
    p.to_str()
        .and_then(|s| s.strip_prefix(r"\\?\"))
        .filter(|rest| !rest.starts_with(r"UNC\"))
        .map(PathBuf::from)
        .unwrap_or(p)
}

/// `engine_path` is what app.json calls engineProjectPath: the engine exe or its folder.
/// Returns (engine dir, engine exe).
pub fn resolve_engine(engine_path: &str) -> AppResult<(PathBuf, PathBuf)> {
    let full = std::fs::canonicalize(engine_path)
        .map(strip_verbatim)
        .map_err(|e| AppError::msg(format!("Engine path '{engine_path}': {e}")))?;

    if full.is_dir() {
        let exe = full.join(ENGINE_EXE);
        if !exe.is_file() {
            return Err(AppError::msg(format!("{ENGINE_EXE} not found in {}", full.display())));
        }
        return Ok((full, exe));
    }

    if !full.is_file() {
        return Err(AppError::msg(format!(
            "Engine executable not found at path: {}",
            full.display()
        )));
    }
    let dir = full
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| AppError::msg("Engine path has no parent folder"))?;
    Ok((dir, full))
}