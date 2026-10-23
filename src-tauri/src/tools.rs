//! Side tool of the engine: OssianTools (cook, build, ...) (Windows, like engine_host.rs).
//!
//! Expected layout (the engine's normal build output):
//!   <engine dir>\OssianForge.exe
//!   <engine dir>\Ossian.ini
//!   <engine dir>\OssianTools\OssianTools.exe
//!
//! Commands:
//!   ossian_tools_layout(enginePath)                -> where everything is (absolute paths)
//!   run_ossian_tool(runId, enginePath, args, cwd)  -> starts OssianTools.exe with `args`
//!                                                     (args[0] is the subcommand: cook | build | clean | list | verify)
//!   cancel_ossian_tool(runId)                      -> kills the tool and its children
//!   ensure_directory(path)                         -> create_dir_all
//!
//! Output is streamed to the webview as `tool://event`:
//!   { "runId": 1, "type": "stdout" | "stderr", "line": "..." }
//!   { "runId": 1, "type": "exit", "code": 0 }
//! The Angular side starts the tool with --json, so stdout lines are JSON events.

use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Emitter};

const ENGINE_EXE: &str = "OssianForge.exe";
const INI_NAME: &str = "Ossian.ini";
const TOOLS_FOLDER: &str = "OssianTools";
const TOOLS_EXE: &str = "OssianTools.exe";

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Running tools. A Vec because `Mutex::new(Vec::new())` is const, `HashMap::new()` is not.
static RUNS: Mutex<Vec<(u64, Arc<Mutex<Child>>)>> = Mutex::new(Vec::new());

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolsLayout {
    engine_dir: String,
    engine_exe: String,
    ossian_ini: String,
    tools_exe: Option<String>,
}

// ── layout ─────────────────────────────────────────────────────────────────

/// `canonicalize` returns `\\?\C:\...` on Windows; the engine and the tools want plain paths.
fn strip_verbatim(p: PathBuf) -> PathBuf {
    let stripped = p
        .to_str()
        .and_then(|s| s.strip_prefix(r"\\?\"))
        .filter(|rest| !rest.starts_with(r"UNC\"))
        .map(PathBuf::from);
    stripped.unwrap_or(p)
}

/// `engine_path` is what app.json calls engineProjectPath: the engine exe or its folder.
/// Relative paths resolve against the process working directory, same as spawn_engine_process.
fn resolve_engine(engine_path: &str) -> Result<(PathBuf, PathBuf), String> {
    let full = std::fs::canonicalize(engine_path)
        .map_err(|e| format!("Engine path '{}': {}", engine_path, e))?;
    let full = strip_verbatim(full);

    if full.is_dir() {
        let exe = full.join(ENGINE_EXE);
        if !exe.is_file() {
            return Err(format!("{} not found in {}", ENGINE_EXE, full.display()));
        }
        Ok((full, exe))
    } else {
        let dir = full
            .parent()
            .ok_or("Engine path has no parent folder")?
            .to_path_buf();
        Ok((dir, full))
    }
}

fn tools_exe(engine_dir: &Path) -> Option<PathBuf> {
    let p = engine_dir.join(TOOLS_FOLDER).join(TOOLS_EXE);
    p.is_file().then_some(p)
}

fn s(p: &Path) -> String {
    p.to_string_lossy().into_owned()
}

#[tauri::command]
pub fn ossian_tools_layout(engine_path: String) -> Result<ToolsLayout, String> {
    let (dir, exe) = resolve_engine(&engine_path)?;
    Ok(ToolsLayout {
        ossian_ini: s(&dir.join(INI_NAME)),
        tools_exe: tools_exe(&dir).map(|p| s(&p)),
        engine_dir: s(&dir),
        engine_exe: s(&exe),
    })
}

#[tauri::command]
pub fn ensure_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| format!("{}: {}", path, e))
}

// ── running ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn run_ossian_tool(
    app: AppHandle,
    run_id: u64,
    engine_path: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<(), String> {
    let (dir, _) = resolve_engine(&engine_path)?;

    // Only OssianTools next to the engine can be started from the webview, never an arbitrary exe.
    let exe = tools_exe(&dir)
        .ok_or_else(|| format!("{} was not found under {}", TOOLS_EXE, dir.join(TOOLS_FOLDER).display()))?;

    let work_dir = match cwd {
        Some(c) => PathBuf::from(c),
        None => exe.parent().map(Path::to_path_buf).unwrap_or_else(|| dir.clone()),
    };

    let mut cmd = Command::new(&exe);
    cmd.args(&args)
        .current_dir(&work_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start {}: {}", exe.display(), e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let child = Arc::new(Mutex::new(child));
    RUNS.lock().unwrap().push((run_id, child.clone()));

    let out_thread = stdout.map(|r| pump(app.clone(), run_id, r, "stdout"));
    let err_thread = stderr.map(|r| pump(app.clone(), run_id, r, "stderr"));

    // Polls instead of wait(), so cancel_ossian_tool can still lock the child to kill it.
    thread::spawn(move || {
        let code = loop {
            let status = child.lock().unwrap().try_wait();
            match status {
                Ok(Some(st)) => break st.code().unwrap_or(-1),
                Ok(None) => thread::sleep(Duration::from_millis(100)),
                Err(_) => break -1,
            }
        };

        // Drain the pipes before announcing the exit, so no output line arrives after it.
        if let Some(t) = out_thread {
            let _ = t.join();
        }
        if let Some(t) = err_thread {
            let _ = t.join();
        }

        RUNS.lock().unwrap().retain(|(id, _)| *id != run_id);
        let _ = app.emit("tool://event", json!({ "runId": run_id, "type": "exit", "code": code }));
    });

    Ok(())
}

fn pump<R: Read + Send + 'static>(
    app: AppHandle,
    run_id: u64,
    reader: R,
    stream: &'static str,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let mut reader = BufReader::new(reader);
        let mut buf = Vec::new();

        loop {
            buf.clear();
            // read_until + lossy decoding: a stray non-UTF-8 byte must not end the stream.
            match reader.read_until(b'\n', &mut buf) {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    let line = String::from_utf8_lossy(&buf)
                        .trim_end_matches(['\r', '\n'])
                        .to_string();
                    let _ = app.emit(
                        "tool://event",
                        json!({ "runId": run_id, "type": stream, "line": line }),
                    );
                }
            }
        }
    })
}

/// Kills the tool and any process tree it started (taskkill /T).
#[tauri::command]
pub fn cancel_ossian_tool(run_id: u64) -> bool {
    let child = RUNS
        .lock()
        .unwrap()
        .iter()
        .find(|(id, _)| *id == run_id)
        .map(|(_, c)| c.clone());

    let Some(child) = child else { return false };
    let mut guard = child.lock().unwrap();

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let killed = Command::new("taskkill")
            .args(["/PID", &guard.id().to_string(), "/T", "/F"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);
        if killed {
            return true;
        }
    }

    guard.kill().is_ok()
}


/// Starts a built game (the exe OssianTools reported). Not tracked: the game outlives the manager.
#[tauri::command]
pub fn launch_game(exe_path: String) -> Result<(), String> {
    let exe = PathBuf::from(&exe_path);
    let is_exe = exe
        .extension()
        .and_then(|e| e.to_str())
        .map_or(false, |e| e.eq_ignore_ascii_case("exe"));

    if !exe.is_file() || !is_exe {
        return Err(format!("'{}' is not an executable file", exe_path));
    }

    let dir = exe.parent().map(Path::to_path_buf).unwrap_or_default();
    Command::new(&exe)
        .current_dir(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to start {}: {}", exe.display(), e))
}