use std::fmt;
use std::io;
use std::path::Path;

use serde::{Serialize, Serializer};

#[derive(Debug)]
pub enum AppError {
    Io { path: String, source: io::Error },
    Message(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn msg(message: impl Into<String>) -> Self {
        AppError::Message(message.into())
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            // Same "path: error" shape the frontend already matches on.
            AppError::Io { path, source } => write!(f, "{path}: {source}"),
            AppError::Message(m) => f.write_str(m),
        }
    }
}

impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

impl From<String> for AppError {
    fn from(m: String) -> Self {
        AppError::Message(m)
    }
}
impl From<&str> for AppError {
    fn from(m: &str) -> Self {
        AppError::Message(m.to_string())
    }
}
impl From<io::Error> for AppError {
    fn from(e: io::Error) -> Self {
        AppError::Message(e.to_string())
    }
}

/// `fs::read(p).at(p)?` attaches the path to an io error.
pub trait IoResultExt<T> {
    fn at(self, path: impl AsRef<Path>) -> AppResult<T>;
}

impl<T> IoResultExt<T> for io::Result<T> {
    fn at(self, path: impl AsRef<Path>) -> AppResult<T> {
        self.map_err(|source| AppError::Io {
            path: path.as_ref().display().to_string(),
            source,
        })
    }
}