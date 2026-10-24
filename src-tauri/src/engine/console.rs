//! engine stdout/stderr -> webview: event `engine://console` { "stream": "stdout"|"stderr"|"system", "line": "..." }
//! webview -> engine stdin: `engine_console_write`

use std::io::{BufRead, BufReader, Read, Write};
use std::process::{Child, ChildStdin};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::error::{AppError, AppResult};

#[derive(Default)]
struct Inner {
    stdin: Mutex<Option<ChildStdin>>,
    /// Bumped on every attach/detach, so output from a replaced engine can't leak into the new session.
    generation: AtomicU64,
}

#[derive(Clone, Default)]
pub struct ConsoleBridge(Arc<Inner>);

impl ConsoleBridge {
    /// Takes the piped stdio from `child` and starts forwarding.
    pub fn attach(&self, app: &AppHandle, child: &mut Child) {
        let generation = self.0.generation.fetch_add(1, Ordering::SeqCst) + 1;
        *self.0.stdin.lock().unwrap() = child.stdin.take();

        if let Some(out) = child.stdout.take() {
            self.pump(app.clone(), out, "stdout", generation, true);
        }
        if let Some(err) = child.stderr.take() {
            self.pump(app.clone(), err, "stderr", generation, false);
        }
    }

    pub fn detach(&self) {
        self.0.generation.fetch_add(1, Ordering::SeqCst);
        *self.0.stdin.lock().unwrap() = None;
    }

    pub fn write(&self, line: &str) -> AppResult<()> {
        let mut guard = self.0.stdin.lock().unwrap();
        let stdin = guard
            .as_mut()
            .ok_or_else(|| AppError::msg("Engine is not running"))?;

        stdin
            .write_all(line.as_bytes())
            .and_then(|_| stdin.write_all(b"\n"))
            .and_then(|_| stdin.flush())
            .map_err(|e| AppError::msg(format!("Failed to write to engine console: {e}")))
    }

    fn is_current(&self, generation: u64) -> bool {
        self.0.generation.load(Ordering::SeqCst) == generation
    }

    fn pump<R: Read + Send + 'static>(
        &self,
        app: AppHandle,
        reader: R,
        stream: &'static str,
        generation: u64,
        announce_exit: bool,
    ) {
        let bridge = self.clone();
        thread::spawn(move || {
            let mut reader = BufReader::new(reader);
            let mut buf = Vec::new();

            loop {
                buf.clear();
                // read_until + lossy decoding: a stray non-UTF-8 byte must not end the stream.
                match reader.read_until(b'\n', &mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(_) => {
                        if !bridge.is_current(generation) {
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
            if announce_exit && bridge.is_current(generation) {
                *bridge.0.stdin.lock().unwrap() = None;
                let _ = app.emit(
                    "engine://console",
                    json!({ "stream": "system", "line": "Engine process exited." }),
                );
            }
        });
    }
}