use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FlagValueType {
    Boolean,
    Integer {
        default: Option<i64>,
        min: Option<i64>,
        max: Option<i64>,
    },
    Float {
        default: Option<f64>,
        min: Option<f64>,
        max: Option<f64>,
    },
    String {
        default: Option<String>,
    },
    Path {
        must_exist: bool,
    },
    Enum {
        options: Vec<String>,
        default: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliFlag {
    pub id: String,
    pub name: String,               // e.g. "--n-gpu-layers"
    pub short_name: Option<String>, // e.g. "-ngl"
    pub description: String,
    pub flag_type: FlagValueType,
    pub category: String,           // "GPU & NPU", "Context", "Performance", "Server", "Sampling"
    pub is_supported: bool,
    pub current_value: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryInspectionResult {
    pub binary_path: String,
    pub version_string: String,
    pub detected_flags: Vec<CliFlag>,
    pub supports_embedding: bool,
    pub supports_gpu_offload: bool,
    pub supports_flash_attention: bool,
    pub supports_custom_devices: bool,
}

pub struct FlagParser;

impl FlagParser {
    /// Parse arbitrary llama-server / llama-cli --help output
    pub fn parse_help(help_text: &str, binary_path: &str) -> BinaryInspectionResult {
        let mut flags: Vec<CliFlag> = Vec::new();

        let has_embedding = help_text.contains("--embedding");
        let has_gpu = help_text.contains("-ngl") || help_text.contains("--n-gpu-layers") || help_text.contains("--gpu-layers");
        let has_fa = help_text.contains("-fa") || help_text.contains("--flash-attn") || help_text.contains("--flash-attention");
        let has_devices = help_text.contains("--device") || help_text.contains("-dev");

        // Canonical flags dictionary to extract and calibrate
        let canonical_definitions = vec![
            (
                "model",
                "--model",
                Some("-m"),
                "Path to local GGUF model file",
                FlagValueType::Path { must_exist: true },
                "Model & Weights",
            ),
            (
                "n_gpu_layers",
                "--n-gpu-layers",
                Some("-ngl"),
                "Number of layers to offload to GPU / NPU (-1 or auto for all)",
                FlagValueType::Integer { default: Some(-1), min: Some(-1), max: Some(128) },
                "GPU & NPU Offload",
            ),
            (
                "device",
                "--device",
                None,
                "Compute device for offloading (e.g. 'AMD NPU', DirectML device ID)",
                FlagValueType::String { default: None },
                "GPU & NPU Offload",
            ),
            (
                "ctx_size",
                "--ctx-size",
                Some("-c"),
                "Total prompt context size in tokens (0 = model default)",
                FlagValueType::Integer { default: Some(4096), min: Some(512), max: Some(131072) },
                "Context & Memory",
            ),
            (
                "batch_size",
                "--batch-size",
                Some("-b"),
                "Logical batch size for prompt processing",
                FlagValueType::Integer { default: Some(512), min: Some(32), max: Some(4096) },
                "Context & Memory",
            ),
            (
                "ubatch_size",
                "--ubatch-size",
                Some("-ub"),
                "Physical micro-batch size for prompt processing (optimal for NPU tiles)",
                FlagValueType::Integer { default: Some(256), min: Some(16), max: Some(2048) },
                "Context & Memory",
            ),
            (
                "threads",
                "--threads",
                Some("-t"),
                "Number of compute threads to use (-1 for automatic detection)",
                FlagValueType::Integer { default: Some(-1), min: Some(-1), max: Some(64) },
                "Performance",
            ),
            (
                "flash_attn",
                "--flash-attn",
                Some("-fa"),
                "Enable Flash Attention for memory reduction and speedup",
                FlagValueType::Boolean,
                "Performance",
            ),
            (
                "cont_batching",
                "--cont-batching",
                Some("-cb"),
                "Enable continuous batching for multi-slot concurrent requests",
                FlagValueType::Boolean,
                "Performance",
            ),
            (
                "host",
                "--host",
                None,
                "Network interface IP to listen on",
                FlagValueType::String { default: Some("127.0.0.1".into()) },
                "Server & Network",
            ),
            (
                "port",
                "--port",
                None,
                "Listening port for OpenAI-compatible REST server",
                FlagValueType::Integer { default: Some(8080), min: Some(1024), max: Some(65535) },
                "Server & Network",
            ),
            (
                "embedding",
                "--embedding",
                None,
                "Enable dedicated embedding mode for vector generation / RAG",
                FlagValueType::Boolean,
                "Embedding & RAG",
            ),
            (
                "temp",
                "--temp",
                None,
                "Sampling temperature (lower = more deterministic)",
                FlagValueType::Float { default: Some(0.7), min: Some(0.0), max: Some(2.0) },
                "Sampling",
            ),
            (
                "top_p",
                "--top-p",
                None,
                "Nucleus top-p sampling probability threshold",
                FlagValueType::Float { default: Some(0.9), min: Some(0.0), max: Some(1.0) },
                "Sampling",
            ),
            (
                "mlock",
                "--mlock",
                None,
                "Lock model weights into RAM to prevent disk swapping",
                FlagValueType::Boolean,
                "Context & Memory",
            ),
            (
                "no_mmap",
                "--no-mmap",
                None,
                "Disable memory-mapped files (forces reading model into RAM)",
                FlagValueType::Boolean,
                "Context & Memory",
            ),
        ];

        for (id, long_name, short_name, desc, val_type, category) in canonical_definitions {
            let present = help_text.contains(long_name)
                || short_name.map_or(false, |s| help_text.contains(&format!("{} ", s)) || help_text.contains(&format!("{},", s)));

            // Extract default value from help text if possible
            let mut resolved_type = val_type.clone();
            if let Some(pos) = help_text.find(long_name) {
                let slice = &help_text[pos..std::cmp::min(pos + 200, help_text.len())];
                if let Some(default_idx) = slice.find("(default: ") {
                    let end_idx = slice[default_idx..].find(')').unwrap_or(0);
                    if end_idx > 10 {
                        let default_str = &slice[default_idx + 10..default_idx + end_idx].trim();
                        match &mut resolved_type {
                            FlagValueType::Integer { default, .. } => {
                                if let Ok(val) = default_str.parse::<i64>() {
                                    *default = Some(val);
                                }
                            }
                            FlagValueType::Float { default, .. } => {
                                if let Ok(val) = default_str.parse::<f64>() {
                                    *default = Some(val);
                                }
                            }
                            FlagValueType::String { default } => {
                                *default = Some(default_str.to_string());
                            }
                            _ => {}
                        }
                    }
                }
            }

            flags.push(CliFlag {
                id: id.to_string(),
                name: long_name.to_string(),
                short_name: short_name.map(|s| s.to_string()),
                description: desc.to_string(),
                flag_type: resolved_type,
                category: category.to_string(),
                is_supported: present,
                current_value: None,
            });
        }

        // Extract binary version string if present
        let version_line = help_text
            .lines()
            .find(|line| line.contains("build =") || line.contains("version") || line.contains("llama.cpp"))
            .unwrap_or("llama.cpp custom binary")
            .trim()
            .to_string();

        BinaryInspectionResult {
            binary_path: binary_path.to_string(),
            version_string: version_line,
            detected_flags: flags,
            supports_embedding: has_embedding,
            supports_gpu_offload: has_gpu,
            supports_flash_attention: has_fa,
            supports_custom_devices: has_devices,
        }
    }

    /// Build exact CLI arguments from user options
    pub fn build_arguments(
        flags: &[CliFlag],
        values: &HashMap<String, serde_json::Value>,
        model_path: &str,
        port: u16,
    ) -> Vec<String> {
        let mut args: Vec<String> = Vec::new();

        // Model path is required
        args.push("-m".into());
        args.push(model_path.into());

        // Always pass port
        args.push("--port".into());
        args.push(port.to_string());

        for flag in flags {
            if !flag.is_supported {
                continue;
            }

            if let Some(val) = values.get(&flag.id) {
                match &flag.flag_type {
                    FlagValueType::Boolean => {
                        if val.as_bool().unwrap_or(false) {
                            args.push(flag.name.clone());
                        }
                    }
                    FlagValueType::Integer { .. } => {
                        if let Some(num) = val.as_i64() {
                            // Don't pass defaults if they're -1 and not set specifically
                            args.push(flag.name.clone());
                            args.push(num.to_string());
                        }
                    }
                    FlagValueType::Float { .. } => {
                        if let Some(num) = val.as_f64() {
                            args.push(flag.name.clone());
                            args.push(format!("{:.2}", num));
                        }
                    }
                    FlagValueType::String { .. } | FlagValueType::Enum { .. } => {
                        if let Some(str_val) = val.as_str() {
                            if !str_val.trim().is_empty() {
                                args.push(flag.name.clone());
                                args.push(str_val.to_string());
                            }
                        }
                    }
                    FlagValueType::Path { .. } => {
                        // Handled separately for model
                        if flag.id != "model" {
                            if let Some(str_val) = val.as_str() {
                                if !str_val.trim().is_empty() {
                                    args.push(flag.name.clone());
                                    args.push(str_val.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }

        args
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_help_flags() {
        let sample_help = r#"
usage: llama-server [options]

options:
  -h, --help            show this help message
  -m, --model FNAME     model path (default: )
  -c, --ctx-size N      size of the prompt context (default: 4096)
  -ngl, --n-gpu-layers N number of layers to store in VRAM
  --device DEV          device to use for offloading (e.g. AMD NPU)
  -fa, --flash-attn     enable Flash Attention
  -t, --threads N       threads to use (default: -1)
  --embedding           enable dedicated embedding endpoint
        "#;

        let result = FlagParser::parse_help(sample_help, "llama-server.exe");
        assert!(result.supports_gpu_offload);
        assert!(result.supports_flash_attention);
        assert!(result.supports_embedding);
        assert!(result.supports_custom_devices);

        let ngl = result.detected_flags.iter().find(|f| f.id == "n_gpu_layers").unwrap();
        assert!(ngl.is_supported);
        assert_eq!(ngl.short_name.as_deref(), Some("-ngl"));

        let ctx = result.detected_flags.iter().find(|f| f.id == "ctx_size").unwrap();
        assert!(ctx.is_supported);
        if let FlagValueType::Integer { default, .. } = ctx.flag_type {
            assert_eq!(default, Some(4096));
        }
    }

    #[test]
    fn test_build_arguments() {
        let sample_help = "-ngl, --n-gpu-layers N\n-c, --ctx-size N\n-fa, --flash-attn\n--device DEV";
        let inspection = FlagParser::parse_help(sample_help, "llama-server.exe");

        let mut values = HashMap::new();
        values.insert("n_gpu_layers".into(), serde_json::json!(-1));
        values.insert("ctx_size".into(), serde_json::json!(8192));
        values.insert("flash_attn".into(), serde_json::json!(true));
        values.insert("device".into(), serde_json::json!("AMD NPU"));

        let args = FlagParser::build_arguments(&inspection.detected_flags, &values, "qwen2.5.gguf", 8080);
        assert!(args.contains(&"-m".to_string()));
        assert!(args.contains(&"qwen2.5.gguf".to_string()));
        assert!(args.contains(&"--port".to_string()));
        assert!(args.contains(&"8080".to_string()));
        assert!(args.contains(&"--n-gpu-layers".to_string()));
        assert!(args.contains(&"-1".to_string()));
        assert!(args.contains(&"--flash-attn".to_string()));
        assert!(args.contains(&"--device".to_string()));
        assert!(args.contains(&"AMD NPU".to_string()));
    }
}
