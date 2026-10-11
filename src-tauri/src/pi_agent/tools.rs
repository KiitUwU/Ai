use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallRequest {
    pub name: String,
    pub arguments: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallOutput {
    pub success: bool,
    pub content: String,
    pub diff: Option<String>,
}

pub struct PiTools {
    pub workspace_root: PathBuf,
}

impl PiTools {
    pub fn new(workspace_root: PathBuf) -> Self {
        Self { workspace_root }
    }

    fn resolve_path(&self, rel_path: &str) -> PathBuf {
        let p = Path::new(rel_path);
        if p.is_absolute() {
            p.to_path_buf()
        } else {
            self.workspace_root.join(p)
        }
    }

    pub fn read_file(&self, path_str: &str) -> ToolCallOutput {
        let target = self.resolve_path(path_str);
        match std::fs::read_to_string(&target) {
            Ok(content) => ToolCallOutput {
                success: true,
                content,
                diff: None,
            },
            Err(e) => ToolCallOutput {
                success: false,
                content: format!("Failed to read file '{}': {}", target.display(), e),
                diff: None,
            },
        }
    }

    pub fn write_file(&self, path_str: &str, content: &str) -> ToolCallOutput {
        let target = self.resolve_path(path_str);
        if let Some(parent) = target.parent() {
            if let Err(e) = std::fs::create_dir_all(parent) {
                return ToolCallOutput {
                    success: false,
                    content: format!("Failed to create directories: {}", e),
                    diff: None,
                };
            }
        }

        match std::fs::write(&target, content) {
            Ok(_) => ToolCallOutput {
                success: true,
                content: format!("Successfully wrote {} bytes to '{}'", content.len(), target.display()),
                diff: Some(format!("+[NEW FILE: {}]\n{}", path_str, content)),
            },
            Err(e) => ToolCallOutput {
                success: false,
                content: format!("Failed to write file '{}': {}", target.display(), e),
                diff: None,
            },
        }
    }

    pub fn edit_file(&self, path_str: &str, search_chunk: &str, replace_chunk: &str) -> ToolCallOutput {
        let target = self.resolve_path(path_str);
        match std::fs::read_to_string(&target) {
            Ok(original) => {
                if !original.contains(search_chunk) {
                    return ToolCallOutput {
                        success: false,
                        content: format!("Search target was not found in '{}'", path_str),
                        diff: None,
                    };
                }

                let updated = original.replacen(search_chunk, replace_chunk, 1);
                if let Err(e) = std::fs::write(&target, &updated) {
                    return ToolCallOutput {
                        success: false,
                        content: format!("Failed to write edits: {}", e),
                        diff: None,
                    };
                }

                let diff = format!("--- {}\n+++ {}\n- {}\n+ {}", path_str, path_str, search_chunk, replace_chunk);
                ToolCallOutput {
                    success: true,
                    content: format!("Successfully edited '{}'", path_str),
                    diff: Some(diff),
                }
            }
            Err(e) => ToolCallOutput {
                success: false,
                content: format!("Failed to read '{}' for editing: {}", path_str, e),
                diff: None,
            },
        }
    }

    pub async fn run_command(&self, command_str: &str, cwd_override: Option<&str>) -> ToolCallOutput {
        let cwd = match cwd_override {
            Some(dir) => self.resolve_path(dir),
            None => self.workspace_root.clone(),
        };

        #[cfg(target_os = "windows")]
        let mut cmd = tokio::process::Command::new("cmd");
        #[cfg(target_os = "windows")]
        cmd.args(["/C", command_str]);

        #[cfg(not(target_os = "windows"))]
        let mut cmd = tokio::process::Command::new("sh");
        #[cfg(not(target_os = "windows"))]
        cmd.args(["-c", command_str]);

        cmd.current_dir(cwd);

        match cmd.output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let combined = format!("STDOUT:\n{}\nSTDERR:\n{}", stdout, stderr);
                ToolCallOutput {
                    success: output.status.success(),
                    content: combined,
                    diff: None,
                }
            }
            Err(e) => ToolCallOutput {
                success: false,
                content: format!("Failed to execute command: {}", e),
                diff: None,
            },
        }
    }
}
