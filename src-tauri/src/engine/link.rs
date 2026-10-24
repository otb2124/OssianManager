//! Named-pipe link to the engine. Newline-delimited JSON:
//!   manager -> engine : {"id":1,"method":"nodes.tree","params":null}
//!   engine  -> manager: {"id":1,"result":...} | {"id":1,"error":"..."}
//!   engine  -> manager: {"event":"nodes.changed","data":null}      (no id)
//! Engine events are re-emitted as `engine://event`, plus `engine://connected` / `engine://disconnected`.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::windows::named_pipe::{NamedPipeServer, ServerOptions};
use tokio::sync::{mpsc, oneshot};

use crate::error::{AppError, AppResult};

type Reply = Result<Value, String>;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Default)]
struct Inner {
    sender: Mutex<Option<mpsc::UnboundedSender<String>>>,
    pending: Mutex<HashMap<u64, oneshot::Sender<Reply>>>,
    next_id: AtomicU64,
    /// Bumped on every connect, so a stale connection closing can't tear down a newer one.
    generation: AtomicU64,
}

#[derive(Clone, Default)]
pub struct EngineLink(Arc<Inner>);

/// Unique per spawn so an engine restart never collides with a pipe instance that is still closing.
pub fn new_pipe_name() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    format!("ossian-engine-{}-{}", std::process::id(), millis)
}

/// Called from a sync command (no tokio context), hence block_on to enter the runtime.
pub fn create_server(name: &str) -> std::io::Result<NamedPipeServer> {
    let full = format!(r"\\.\pipe\{}", name);
    tauri::async_runtime::block_on(async move {
        let mut opts = ServerOptions::new();
        opts.first_pipe_instance(true);
        opts.create(full)
    })
}

impl EngineLink {
    /// Waits for the engine to connect, then pumps messages until the pipe closes.
    pub fn start(&self, app: AppHandle, server: NamedPipeServer) {
        let link = self.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = server.connect().await {
                eprintln!("[Rust] Engine pipe connect failed: {e}");
                return;
            }

            let generation = link.0.generation.fetch_add(1, Ordering::SeqCst) + 1;
            let (read_half, mut write_half) = tokio::io::split(server);
            let (tx, mut rx) = mpsc::unbounded_channel::<String>();
            *link.0.sender.lock().unwrap() = Some(tx);
            println!("[Rust] Engine pipe connected");
            let _ = app.emit("engine://connected", ());

            // Writer: ends when the sender is dropped (fail_all) or a write fails.
            tauri::async_runtime::spawn(async move {
                while let Some(line) = rx.recv().await {
                    let mut buf = line.into_bytes();
                    buf.push(b'\n');
                    if write_half.write_all(&buf).await.is_err() {
                        break;
                    }
                }
            });

            let mut lines = BufReader::new(read_half).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                link.dispatch(&app, &line);
            }

            println!("[Rust] Engine pipe closed");
            if link.0.generation.load(Ordering::SeqCst) == generation {
                link.fail_all("Engine disconnected");
                let _ = app.emit("engine://disconnected", ());
            }
        });
    }

    pub async fn request(&self, method: String, params: Option<Value>) -> AppResult<Value> {
        let sender = self
            .0
            .sender
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| AppError::msg("Engine is not connected"))?;

        let id = self.0.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        self.0.pending.lock().unwrap().insert(id, tx);

        let msg = json!({ "id": id, "method": method, "params": params.unwrap_or(Value::Null) });
        if sender.send(msg.to_string()).is_err() {
            self.0.pending.lock().unwrap().remove(&id);
            return Err("Engine pipe is closed".into());
        }

        match tokio::time::timeout(REQUEST_TIMEOUT, rx).await {
            Ok(Ok(reply)) => reply.map_err(AppError::from),
            Ok(Err(_)) => Err("Engine disconnected".into()),
            Err(_) => {
                self.0.pending.lock().unwrap().remove(&id);
                Err(AppError::msg(format!("Engine did not answer '{method}' in time")))
            }
        }
    }

    fn dispatch(&self, app: &AppHandle, line: &str) {
        let Ok(msg) = serde_json::from_str::<Value>(line) else {
            eprintln!("[Rust] Bad engine message: {line}");
            return;
        };

        if let Some(id) = msg.get("id").and_then(Value::as_u64) {
            let tx = self.0.pending.lock().unwrap().remove(&id);
            if let Some(tx) = tx {
                let reply = match msg.get("error").and_then(Value::as_str) {
                    Some(e) => Err(e.to_string()),
                    None => Ok(msg.get("result").cloned().unwrap_or(Value::Null)),
                };
                let _ = tx.send(reply);
            }
        } else if msg.get("event").is_some() {
            let _ = app.emit("engine://event", msg);
        }
    }

    /// Connection lost: drop the writer and fail every in-flight request.
    fn fail_all(&self, why: &str) {
        *self.0.sender.lock().unwrap() = None;
        let drained: Vec<_> = self.0.pending.lock().unwrap().drain().collect();
        for (_, tx) in drained {
            let _ = tx.send(Err(why.to_string()));
        }
    }
}