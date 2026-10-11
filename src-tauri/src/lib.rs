pub mod commands;
pub mod hardware;
pub mod pi_agent;
pub mod process;
pub mod rag;
pub mod web;

use std::sync::Arc;
use tokio::sync::Mutex;

use commands::AppState;
use pi_agent::PiAgentRunner;
use process::LlamaServerRunner;
use rag::RagEngine;
use web::{PageScraper, SearchClient};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));

    let llm_runner = Arc::new(LlamaServerRunner::new(false, 8080));
    let embedding_runner = Arc::new(LlamaServerRunner::new(true, 8081));
    let rag_engine = Arc::new(Mutex::new(
        RagEngine::new("http://127.0.0.1:8081", true)
            .expect("Failed to initialize RAG Engine"),
    ));
    let search_client = Arc::new(SearchClient::new());
    let scraper = Arc::new(PageScraper::new());
    let pi_runner = Arc::new(PiAgentRunner::new(cwd));

    let app_state = AppState {
        llm_runner,
        embedding_runner,
        rag_engine,
        search_client,
        scraper,
        pi_runner,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_hardware_info,
            commands::inspect_binary_flags,
            commands::start_server,
            commands::stop_server,
            commands::get_server_status,
            commands::search_web,
            commands::scrape_urls,
            commands::rag_ingest,
            commands::rag_query,
            commands::rag_list_docs,
            commands::run_pi_agent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Small AI Studio application");
}
