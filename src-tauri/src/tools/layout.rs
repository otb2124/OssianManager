use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::engine::location::resolve_engine;
use crate::error::AppResult;

const INI_NAME: &str = "Ossian.ini";
pub const TOOLS_FOLDER: &str = "OssianTools";
pub const TOOLS_EXE: &str = "OssianTools.exe";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolsLayout {
    engine_dir: String,
    engine_exe: String,
    ossian_ini: String,
    tools_exe: Option<String>,
}

pub fn tools_exe(engine_dir: &Path) -> Option<PathBuf> {
    let p = engine_dir.join(TOOLS_FOLDER).join(TOOLS_EXE);
    p.is_file().then_some(p)
}

fn s(p: &Path) -> String {
    p.to_string_lossy().into_owned()
}

pub fn resolve(engine_path: &str) -> AppResult<ToolsLayout> {
    let (dir, exe) = resolve_engine(engine_path)?;
    Ok(ToolsLayout {
        ossian_ini: s(&dir.join(INI_NAME)),
        tools_exe: tools_exe(&dir).map(|p| s(&p)),
        engine_dir: s(&dir),
        engine_exe: s(&exe),
    })
}