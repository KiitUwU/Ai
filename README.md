# Small AI Studio ⚡

> **A lightweight, high-performance native desktop AI studio for Windows 11, built with Rust (Tauri 2.0).**  
> Designed with the dark, developer-focused aesthetic of **LM Studio**, featuring **Chat** and **Code (Pi Agent)** modes, automatic CLI flag parsing for custom **`llama.cpp`** builds, dedicated **AMD XDNA / XDNA 2** NPU acceleration for LLMs and embeddings, zero-config built-in **Web Search**, and an offline **RAG Vector Database**.

---

## 🌟 Key Features

### 1. LM Studio-Inspired Aesthetic & Ergonomics
- **Obsidian Dark Theme**: High-contrast, developer-friendly interface (`#0B0D13`, `#12151D`, `#171B26`).
- **Slim Left Navigation Rail**: Quick switching between **Chat**, **Developer / Pi Agent**, **Web & RAG Discovery**, **Local Server**, and **Settings**.
- **Model Selector & Hardware HUD**:
  - Live RAM & VRAM allocation gauges.
  - Active model indicator with quantization tag (`Q4_K_M`, `Q8_0`).
  - Real-time `⚡ AMD XDNA 2 NPU (50 TOPS)` hardware badge.
  - One-click model eject and server start/stop controls.
- **Collapsible Inference Parameters Drawer** (The signature LM Studio feature):
  - Sliders for Temperature (`0.00` – `2.00`), Context Window (`2k` – `32k`), GPU/NPU Offload layers (`-ngl`), CPU Threads (`-t`), and Flash Attention (`-fa`).
  - Compute device selector: `AMD XDNA 2 (DirectML NPU)`, `DirectML GPU`, `Vulkan`, `CPU (AVX-512)`.
  - System prompt presets and live token speed indicators (`tok/s`, `TTFT`).

### 2. Dual Workflows: Chat & Developer / Pi Agent Mode
- **Chat Mode**:
  - Conversational streaming assistant with generation telemetry (`tok/s`, latency, tokens).
  - Quick pills for **Web Search** and **Knowledge Base RAG**.
  - Interactive source citation cards and rich markdown with syntax-highlighted code blocks.
- **Code (Pi Agent) Mode**:
  - Autonomous ReAct coding loop inspired by **Pi Coding Agent** and **Claude Code Canvas**.
  - Split-screen workspace:
    - **Left**: Step-by-step reasoning stream (`Thought`, `read_file`, `write_file`, `edit_file`, `run_command` terminal output, `diff`).
    - **Right (Code Canvas)**: Interactive code editor, multi-file tabs, live diff reviewer, "Save to Local Disk", and embedded terminal console.

### 3. Custom `llama.cpp` & Automatic CLI Flag Parser
- Point the app to **any** custom `llama.cpp` binary (`llama-server.exe`, `llama-cli.exe`, DirectML builds, Vulkan builds, or custom XDNA forks).
- **Auto Flag Inspector**: Executes `--help` behind the scenes, parses all supported short and long flags with type inference, and dynamically generates configuration controls with validation.
- **Live CLI Preview**: Watch the exact generated command-line string update in real time.
- **Win32 Job Object Process Safety**: When Small AI Studio closes, Windows automatically terminates child `llama-server.exe` processes—leaving zero orphaned background processes eating memory or battery.

### 4. Native AMD XDNA & XDNA 2 (Ryzen AI NPU) Support
- **Hardware Auto-Detection**: Queries Windows 11 DXGI / WMI compute accelerators to detect:
  - **AMD XDNA 1** (Phoenix / Hawk Point, 16 TOPS).
  - **AMD XDNA 2** (Ryzen AI 300 / Strix Point, 50 TOPS).
- **Accelerated Embedding Generation**: Directs transformer encoder models (`BAAI/bge-m3`, `bge-small-en-v1.5`, `nomic-embed-text`) directly to the XDNA 2 NPU via DirectML, generating vectors in ~1.5ms per chunk with ultra-low power consumption (~2–5W).
- **One-Click NPU Presets**: Tailored KV-cache, micro-batch size (`-ub 256`), and layer configurations for lightweight quantized models (Qwen2.5-3B, Phi-3.5-mini, Llama-3.2-3B).

### 5. Built-in Web Search & Page Scraper
- **Zero-Config Search**: Direct DuckDuckGo HTML engine integration (no API keys, subscriptions, or external accounts required).
- **Readability Content Extraction**: High-speed scraper strips scripts, ads, and boilerplate HTML, converting page content into clean Markdown with citation cards.

### 6. Offline RAG (Retrieval-Augmented Generation)
- **Local SQLite Vector Store**: Embeds documents (`.md`, `.txt`, `.rs`, `.py`, `.ts`, `.pdf`, `.docx`) into a private local SQLite vector database.
- **SIMD-Accelerated Cosine Similarity**: Fast Top-K semantic retrieval and chunk context injection for both conversational chat and autonomous Pi Agent tasks.

---

## 🏗️ Architecture

```
Small AI Studio
├── src-tauri/                       # Rust Backend Core
│   ├── src/
│   │   ├── commands/                # Tauri IPC commands
│   │   ├── hardware/                # AMD XDNA / XDNA 2 hardware detection & presets
│   │   ├── pi_agent/                # Autonomous Pi Agent loop & local tool execution
│   │   ├── process/                 # Flag parser, Win32 Job Object & process runner
│   │   ├── rag/                     # Chunker, embeddings client & SQLite vector store
│   │   └── web/                     # DuckDuckGo search client & readability scraper
│   └── Cargo.toml
├── src/                             # Frontend (React + TypeScript + Tailwind)
│   ├── components/
│   │   ├── Chat/                    # LM Studio chat view with telemetry HUD
│   │   ├── Code/                    # Pi Agent split mode with Code Canvas
│   │   ├── NavigationRail.tsx       # LM Studio 60px left icon rail
│   │   ├── TopHeader.tsx            # Top model selector with RAM/VRAM gauges
│   │   ├── RightParameterDrawer.tsx # Collapsible inference sliders drawer
│   │   ├── Server/                  # Custom llama.cpp & dynamic flag configurator
│   │   ├── RAG/                     # Document ingestion & semantic search tester
│   │   └── Settings/                # Application preferences modal
│   ├── styles/globals.css           # Obsidian theme & styling
│   └── App.tsx
├── tauri.conf.json                  # Native Windows 11 configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Windows 11** (64-bit)
- **Node.js** 18+ & npm
- **Rust** 1.75+ (`rustup`)
- Any `llama-server.exe` build (optional; app includes mock and fallback runners)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

To run with the native Tauri window:
```bash
npm run tauri dev
```

### 3. Build for Production (Windows 11 Installer / Standalone EXE)
```bash
npm run tauri build
```
The resulting executable (~12–15 MB) will be generated in `src-tauri/target/release/`.

---

## 🧪 Running Automated Tests

Run backend unit tests:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Verify frontend build:
```bash
npm run build
```

---

## 📜 License
MIT License. Built for local, private, high-performance desktop AI.