use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use serde::Serialize;

use crate::error::{AppError, AppResult, IoResultExt};

/// What marks a folder as an Ossian project (see ProjectService.configFileName).
pub const PROJECT_CONFIG_FILE: &str = ".ossian.project.json";
const MAX_SCAN_DEPTH: u32 = 4;

#[derive(Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: Option<String>,
}

pub fn resolve_in_cwd(relative: &str) -> AppResult<PathBuf> {
    Ok(std::env::current_dir()?.join(relative))
}

pub fn read_text(path: &Path) -> AppResult<String> {
    fs::read_to_string(path).at(path)
}

pub fn write_text(path: &Path, content: &str) -> AppResult<()> {
    fs::write(path, content).at(path)
}

pub fn ensure_directory(path: &Path) -> AppResult<()> {
    fs::create_dir_all(path).at(path)
}

pub fn delete_directory(path: &Path) -> AppResult<()> {
    if !path.exists() {
        return Err(AppError::msg(format!("Path does not exist: {}", path.display())));
    }
    fs::remove_dir_all(path).at(path)
}

pub fn list_directory(path: &Path) -> AppResult<Vec<DirEntry>> {
    let mut entries: Vec<DirEntry> = fs::read_dir(path)
        .at(path)?
        .flatten()
        .filter_map(|e| to_dir_entry(&e))
        .collect();

    entries.sort_by(|a, b| {
        b.is_directory
            .cmp(&a.is_directory)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}

/// One unreadable entry is skipped instead of failing the whole listing.
fn to_dir_entry(entry: &fs::DirEntry) -> Option<DirEntry> {
    let path = entry.path();
    let meta = entry.metadata().ok()?;
    Some(DirEntry {
        name: entry.file_name().to_string_lossy().into_owned(),
        path: path.to_string_lossy().into_owned(),
        is_directory: path.is_dir(),
        size: meta.len(),
        modified: meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs().to_string()),
    })
}

pub fn rename_entry(old: &Path, new_name: &str) -> AppResult<PathBuf> {
    if new_name.is_empty() || new_name.contains(['/', '\\']) {
        return Err(AppError::msg(format!("Invalid name: '{new_name}'")));
    }
    let parent = old
        .parent()
        .ok_or_else(|| AppError::msg("Cannot determine parent directory"))?;
    let new_path = parent.join(new_name);
    fs::rename(old, &new_path).at(old)?;
    Ok(new_path)
}

pub fn scan_for_projects(root: &Path) -> Vec<String> {
    let mut found = Vec::new();
    scan_dir(root, &mut found, 0);
    found
}

fn scan_dir(dir: &Path, found: &mut Vec<String>, depth: u32) {
    if depth > MAX_SCAN_DEPTH {
        return;
    }
    if dir.join(PROJECT_CONFIG_FILE).exists() {
        if let Some(p) = dir.to_str() {
            found.push(p.to_string());
        }
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_dir(&path, found, depth + 1);
            }
        }
    }
}

pub fn reveal(path: &str) {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path.replace('/', "\\")))
            .spawn()
            .ok();
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").args(["-R", path]).spawn().ok();
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(path).spawn().ok();
    }
}