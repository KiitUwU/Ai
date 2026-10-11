use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;

use crate::hardware::{HardwareDetector, HardwareReport};
use crate::pi_agent::{AgentStep, PiAgentRunner};
use crate::process::{BinaryInspectionResult, FlagParser, LlamaServerRunner, ProcessState};
use crate::rag::{vector_store::IngestedDocumentInfo, RagEngine, RagSearchResult};
use crate::web::{PageScraper, ScrapedPage, SearchClient, SearchResult};

pub struct AppState {
    pub llm_runner: Arc<LlamaServerRunner>,
    pub embedding_runner: Arc<LlamaServerRunner>,
    pub rag_engine: Arc<Mutex<RagEngine>>,
    pub search_client: Arc<SearchClient>,
    pub scraper: Arc<PageScraper>,
    pub pi_runner: Arc<PiAgentRunner>,
}

#[tauri::command]
pub async fn get_hardware_info() -> Result<HardwareReport, String> {
    Ok(HardwareDetector::scan_hardware())
}

#[tauri::command]
pub async fn inspect_binary_flags(binary_path: String) -> Result<BinaryInspectionResult, String> {
    let help_output = if std::path::Path::new(&binary_path).exists() {
        let output = tokio::process::Command::new(&binary_path)
            .arg("--help")
            .output()
            .await;
        match output {
            Ok(out) => {
                String::from_utf8_lossy(&out.stdout).to_string()
                    + &String::from_utf8_lossy(&out.stderr)
            }
            Err(_) => get_fallback_llama_help(),
        }
    } else {
        get_fallback_llama_help()
    };

    Ok(FlagParser::parse_help(&help_output, &binary_path))
}

#[tauri::command]
pub async fn start_server(
    state: State<'_, AppState>,
    binary_path: String,
    model_path: String,
    flag_values: HashMap<String, serde_json::Value>,
    port: u16,
    is_embedding: bool,
) -> Result<u32, String> {
    let runner = if is_embedding {
        &state.embedding_runner
    } else {
        &state.llm_runner
    };

    let inspection = inspect_binary_flags(binary_path.clone()).await?;
    let mut args = FlagParser::build_arguments(&inspection.detected_flags, &flag_values, &model_path, port);

    if is_embedding {
        if !args.contains(&"--embedding".to_string()) {
            args.push("--embedding".into());
        }
    }

    runner.start(&binary_path, &args)
}

#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>, is_embedding: bool) -> Result<(), String> {
    let runner = if is_embedding {
        &state.embedding_runner
    } else {
        &state.llm_runner
    };
    runner.stop()
}

#[tauri::command]
pub async fn get_server_status(
    state: State<'_, AppState>,
    is_embedding: bool,
) -> Result<ProcessState, String> {
    let runner = if is_embedding {
        &state.embedding_runner
    } else {
        &state.llm_runner
    };
    Ok(runner.get_state())
}

#[tauri::command]
pub async fn search_web(
    state: State<'_, AppState>,
    query: String,
    max_results: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    state
        .search_client
        .search(&query, max_results.unwrap_or(5))
        .await
}

#[tauri::command]
pub async fn scrape_urls(
    state: State<'_, AppState>,
    urls: Vec<String>,
) -> Result<Vec<ScrapedPage>, String> {
    Ok(state.scraper.scrape_and_synthesize(&urls).await)
}

#[tauri::command]
pub async fn rag_ingest(
    state: State<'_, AppState>,
    filename: String,
    path: String,
    collection: String,
    content: String,
) -> Result<i64, String> {
    let engine = state.rag_engine.lock().await;
    engine.ingest_text(&filename, &path, &collection, &content).await
}

#[tauri::command]
pub async fn rag_query(
    state: State<'_, AppState>,
    query: String,
    top_k: Option<usize>,
) -> Result<Vec<RagSearchResult>, String> {
    let engine = state.rag_engine.lock().await;
    engine.search_relevant(&query, top_k.unwrap_or(4)).await
}

#[tauri::command]
pub async fn rag_list_docs(
    state: State<'_, AppState>,
) -> Result<Vec<IngestedDocumentInfo>, String> {
    let engine = state.rag_engine.lock().await;
    engine.vector_store.list_documents()
}

#[tauri::command]
pub async fn run_pi_agent(
    state: State<'_, AppState>,
    task: String,
) -> Result<Vec<AgentStep>, String> {
    let runner = state.pi_runner.clone();

    let _ = runner
        .run_task(&task, move |_step| {
            // Emitted to runner session state
        })
        .await?;

    let session = runner.state.lock().await;
    Ok(session.steps.clone())
}

fn get_fallback_llama_help() -> String {
    r#"
usage: llama-server [options]

options:
  -h, --help            show this help message and exit
  -m, --model FNAME     model path (default: )
  -c, --ctx-size N      size of the prompt context (default: 4096)
  -ngl, --n-gpu-layers N number of layers to store in VRAM (default: -1)
  --device DEV          device to use for offloading (e.g. Vulkan, DirectML, AMD NPU)
  -t, --threads N       number of threads to use during generation (default: -1)
  -fa, --flash-attn     enable Flash Attention (default: disabled)
  -b, --batch-size N    logical maximum batch size (default: 512)
  -ub, --ubatch-size N  physical batch size for prompt processing (default: 256)
  --host IP             ip to listen on (default: 127.0.0.1)
  --port PORT           port to listen on (default: 8080)
  --embedding           enable dedicated embedding endpoint (default: disabled)
  --temp N              temperature (default: 0.8)
  --top-p N             top-p sampling (default: 0.9)
  --cont-batching       enable continuous batching (default: disabled)
  --mlock               force system to keep model in RAM
  --no-mmap             do not memory-map model
"#
    .to_string()
}
