//! Console link to the embedded C# engine: the engine's stdin/stdout/stderr are piped, so the
//! manager can type into the engine's console (Console.ReadLine) and show what it prints.
//!
//!   engine stdout/stderr -> webview : event `engine://console`  { "stream": "stdout"|"stderr"|"system", "line": "..." }
//!   webview -> engine stdin         : command `engine_console_write(line)`
//!
//! Lines are forwarded when the engine ends them with a newline, so a prompt written with
//! Console.Write (no newline) only shows up once the line is finished.

use std::io::{BufRead, BufReader, Read, Write};
use std::process::{Child, ChildStdin};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::thread;

use serde_json::json;
use tauri::{AppHandle, Emitter};

static ENGINE_STDIN: Mutex<Option<ChildStdin>> = Mutex::new(None);

/// Bumped on every attach, so output from a replaced engine can't leak into the new session.
static GENERATION: AtomicU64 = AtomicU64::new(0);

/// Drops the stdin handle of the previous engine. Call when the engine is replaced.
pub fn detach() {
    GENERATION.fetch_add(1, Ordering::SeqCst);
    *ENGINE_STDIN.lock().unwrap() = None;
}

/// Takes the piped stdio from `child` and starts forwarding. The child must have been spawned
/// with `Stdio::piped()` for stdin, stdout and stderr.
pub fn attach(app: &AppHandle, child: &mut Child) {
    let generation = GENERATION.fetch_add(1, Ordering::SeqCst) + 1;
    *ENGINE_STDIN.lock().unwrap() = child.stdin.take();

    if let Some(out) = child.stdout.take() {
        pump(app.clone(), out, "stdout", generation, true);
    }
    if let Some(err) = child.stderr.take() {
        pump(app.clone(), err, "stderr", generation, false);
    }
}

fn pump<R: Read + Send + 'static>(
    app: AppHandle,
    reader: R,
    stream: &'static str,
    generation: u64,
    announce_exit: bool,
) {
    thread::spawn(move || {
        let mut reader = BufReader::new(reader);
        let mut buf = Vec::new();

        loop {
            buf.clear();
            // read_until + lossy decoding: a stray non-UTF-8 byte must not end the stream.
            match reader.read_until(b'\n', &mut buf) {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    if GENERATION.load(Ordering::SeqCst) != generation {
                        return;
                    }
                    let line = String::from_utf8_lossy(&buf)
                        .trim_end_matches(['\r', '\n'])
                        .to_string();
                    let _ = app.emit("engine://console", json!({ "stream": stream, "line": line }));
                }
            }
        }

        // stdout closing means the engine process is gone.
        if announce_exit && GENERATION.load(Ordering::SeqCst) == generation {
            *ENGINE_STDIN.lock().unwrap() = None;
            let _ = app.emit(
                "engine://console",
                json!({ "stream": "system", "line": "Engine process exited." }),
            );
        }
    });
}

#[tauri::command]
pub fn engine_console_write(line: String) -> Result<(), String> {
    let mut guard = ENGINE_STDIN.lock().unwrap();
    let stdin = guard
        .as_mut()
        .ok_or_else(|| "Engine is not running".to_string())?;

    stdin
        .write_all(line.as_bytes())
        .and_then(|_| stdin.write_all(b"\n"))
        .and_then(|_| stdin.flush())
        .map_err(|e| format!("Failed to write to engine console: {e}"))
}