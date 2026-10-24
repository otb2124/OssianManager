use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::error::{AppError, AppResult};
use crate::util::CommandHiddenExt;

#[derive(Default)]
struct Inner {
    runs: Mutex<HashMap<u64, Arc<Mutex<Child>>>>,
}

/// Tracks the running tool processes by run id.
#[derive(Clone, Default)]
pub struct ToolRunner(Arc<Inner>);

impl ToolRunner {
    pub fn start(
        &self,
        app: AppHandle,
        run_id: u64,
        exe: &Path,
        args: &[String],
        cwd: &Path,
    ) -> AppResult<()> {
        let mut child = Command::new(exe)
            .args(args)
            .current_dir(cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .hidden()
            .spawn()
            .map_err(|e| AppError::msg(format!("Failed to start {}: {e}", exe.display())))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let child = Arc::new(Mutex::new(child));
        self.0.runs.lock().unwrap().insert(run_id, child.clone());

        let out_thread = stdout.map(|r| pump(app.clone(), run_id, r, "stdout"));
        let err_thread = stderr.map(|r| pump(app.clone(), run_id, r, "stderr"));

        let runner = self.clone();
        // Polls instead of wait(), so cancel() can still lock the child to kill it.
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
            for t in [out_thread, err_thread].into_iter().flatten() {
                let _ = t.join();
            }

            runner.0.runs.lock().unwrap().remove(&run_id);
            let _ = app.emit("tool://event", json!({ "runId": run_id, "type": "exit", "code": code }));
        });

        Ok(())
    }

    /// Kills the tool and any process tree it started (taskkill /T).
    pub fn cancel(&self, run_id: u64) -> bool {
        let Some(child) = self.0.runs.lock().unwrap().get(&run_id).cloned() else {
            return false;
        };
        let mut guard = child.lock().unwrap();

        #[cfg(windows)]
        {
            let killed = Command::new("taskkill")
                .args(["/PID", &guard.id().to_string(), "/T", "/F"])
                .hidden()
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
            if killed {
                return true;
            }
        }

        guard.kill().is_ok()
    }
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