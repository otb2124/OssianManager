use std::mem;
use std::os::windows::io::AsRawHandle;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::ptr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use winapi::um::jobapi2::{AssignProcessToJobObject, CreateJobObjectW, SetInformationJobObject};
use winapi::um::winnt::{
    JobObjectExtendedLimitInformation, HANDLE, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};

use crate::error::{AppError, AppResult};
use crate::util::CommandHiddenExt;

/// Job with KILL_ON_JOB_CLOSE. The handle is deliberately never closed: Windows closes it when the
/// manager process ends (closed, crashed, restarted by `cargo run`), which kills the engine too.
struct KillOnCloseJob(usize);

impl KillOnCloseJob {
    fn create() -> Option<Self> {
        unsafe {
            let job = CreateJobObjectW(ptr::null_mut(), ptr::null());
            if job.is_null() {
                return None;
            }
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = mem::zeroed();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let ok = SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &mut info as *mut _ as *mut _,
                mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            (ok != 0).then(|| Self(job as usize))
        }
    }

    fn assign(&self, child: &Child) {
        unsafe {
            AssignProcessToJobObject(self.0 as HANDLE, child.as_raw_handle() as HANDLE);
        }
    }
}

struct Inner {
    child: Mutex<Option<Child>>,
    job: Option<KillOnCloseJob>,
    /// Bumped on every stop, so background work started for an old engine can tell it is stale.
    generation: AtomicU64,
}

#[derive(Clone)]
pub struct EngineProcess(Arc<Inner>);

impl Default for EngineProcess {
    fn default() -> Self {
        Self(Arc::new(Inner {
            child: Mutex::new(None),
            job: KillOnCloseJob::create(),
            generation: AtomicU64::new(0),
        }))
    }
}

impl EngineProcess {
    /// Starts the engine with piped stdio. The caller attaches the console, then calls `install`.
    pub fn spawn(&self, exe: &Path, pipe: &str) -> AppResult<Child> {
        let dir = exe
            .parent()
            .ok_or_else(|| AppError::msg("Failed to get executable directory"))?;

        let child = Command::new(exe)
            .arg("--embedded")
            .arg("--pipe")
            .arg(pipe)
            .current_dir(dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .hidden() // the engine still gets a (hidden) console, so Console.WriteLine keeps working
            .spawn()
            .map_err(|e| AppError::msg(format!("Failed to launch process: {e}")))?;

        if let Some(job) = &self.0.job {
            job.assign(&child);
        }
        Ok(child)
    }

    /// Takes ownership of the running child. Returns (pid, generation).
    pub fn install(&self, child: Child) -> (u32, u64) {
        let pid = child.id();
        *self.0.child.lock().unwrap() = Some(child);
        (pid, self.0.generation.load(Ordering::SeqCst))
    }

    pub fn stop(&self) {
        self.0.generation.fetch_add(1, Ordering::SeqCst);
        if let Some(mut old) = self.0.child.lock().unwrap().take() {
            let _ = old.kill();
            let _ = old.wait();
        }
    }

    pub fn is_current(&self, generation: u64) -> bool {
        self.0.generation.load(Ordering::SeqCst) == generation
    }
}