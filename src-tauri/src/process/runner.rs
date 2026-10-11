use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use super::job_object::JobObjectGuard;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServerStatus {
    Stopped,
    Starting,
    Running,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessState {
    pub status: ServerStatus,
    pub pid: Option<u32>,
    pub port: u16,
    pub binary_path: String,
    pub model_path: String,
    pub is_embedding: bool,
    pub logs: Vec<String>,
}

pub struct LlamaServerRunner {
    child: Arc<Mutex<Option<Child>>>,
    job_guard: Arc<JobObjectGuard>,
    pub state: Arc<Mutex<ProcessState>>,
}

impl LlamaServerRunner {
    pub fn new(is_embedding: bool, port: u16) -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            job_guard: Arc::new(JobObjectGuard::new()),
            state: Arc::new(Mutex::new(ProcessState {
                status: ServerStatus::Stopped,
                pid: None,
                port,
                binary_path: String::new(),
                model_path: String::new(),
                is_embedding,
                logs: Vec::new(),
            })),
        }
    }

    pub fn start(&self, binary_path: &str, args: &[String]) -> Result<u32, String> {
        let mut child_lock = self.child.lock().unwrap();
        if child_lock.is_some() {
            return Err("Server is already running".into());
        }

        let mut cmd = Command::new(binary_path);
        cmd.args(args);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let spawned = cmd.spawn().map_err(|e| format!("Failed to spawn {}: {}", binary_path, e))?;
        let pid = spawned.id();

        // Assign to Win32 Job Object so it is killed when this app exits
        self.job_guard.assign_child(&spawned);

        *child_lock = Some(spawned);

        let mut state = self.state.lock().unwrap();
        state.status = ServerStatus::Running;
        state.pid = Some(pid);
        state.binary_path = binary_path.to_string();
        state.logs.push(format!("Server launched with PID {}. Args: {:?}", pid, args));

        Ok(pid)
    }

    pub fn stop(&self) -> Result<(), String> {
        let mut child_lock = self.child.lock().unwrap();
        if let Some(mut child) = child_lock.take() {
            let _ = child.kill();
            let _ = child.wait();
        }

        let mut state = self.state.lock().unwrap();
        state.status = ServerStatus::Stopped;
        state.pid = None;
        state.logs.push("Server stopped.".into());

        Ok(())
    }

    pub fn get_state(&self) -> ProcessState {
        self.state.lock().unwrap().clone()
    }

    pub async fn wait_for_health(&self, timeout_secs: u64) -> bool {
        let port = self.state.lock().unwrap().port;
        let url = format!("http://127.0.0.1:{}/health", port);
        let client = reqwest::Client::new();
        let start = std::time::Instant::now();

        while start.elapsed() < Duration::from_secs(timeout_secs) {
            if let Ok(res) = client.get(&url).send().await {
                if res.status().is_success() {
                    return true;
                }
            }
            tokio::time::sleep(Duration::from_millis(500)).await;
        }

        false
    }
}
