use std::path::Path;
use std::process::Command;

use serde::Serialize;

use crate::error::{AppError, AppResult};
use crate::util::CommandHiddenExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommit {
    pub hash: String,
    pub hash_short: String,
    pub message: String,
    pub author: String,
    pub date: String,
    pub branch: String,
}

pub fn latest_commit(repo: &Path) -> AppResult<GitCommit> {
    let log = git(repo, &["log", "-1", "--pretty=format:%H%n%s%n%an%n%aI"])?;
    let mut lines = log.lines();
    let mut next = || lines.next().unwrap_or_default().to_string();

    let hash = next();
    let message = next();
    let author = next();
    let date = next();
    let branch = git(repo, &["rev-parse", "--abbrev-ref", "HEAD"])?;

    Ok(GitCommit {
        hash_short: hash.chars().take(7).collect(),
        hash,
        message,
        author,
        date,
        branch,
    })
}

fn git(cwd: &Path, args: &[&str]) -> AppResult<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .hidden()
        .output()
        .map_err(|e| AppError::msg(format!("Failed to run git: {e}")))?;

    if !output.status.success() {
        return Err(AppError::msg(String::from_utf8_lossy(&output.stderr).to_string()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}