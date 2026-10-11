import React, { useState, useEffect } from 'react';
import { NavigationRail } from './components/NavigationRail';
import { TopHeader } from './components/TopHeader';
import { RightParameterDrawer } from './components/RightParameterDrawer';
import { ChatView } from './components/Chat/ChatView';
import { CodeModeView } from './components/Code/CodeModeView';
import { ServerConfigView } from './components/Server/ServerConfigView';
import { RagDiscoveryView } from './components/RAG/RagDiscoveryView';
import { SettingsModal } from './components/Settings/SettingsModal';
import { 
  NavigationTab, 
  ChatMessage, 
  HardwareReport, 
  InferenceParams, 
  CodeArtifact, 
  PiAgentStepData,
  BinaryInspectionResult,
  ProcessState
} from './types';

// Safe Tauri invocation helper with web fallbacks
const invokeTauri = async <T,>(cmd: string, args: Record<string, any> = {}): Promise<T> => {
  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }
  
  // High-fidelity fallback simulated data for browser preview/testing
  if (cmd === 'get_hardware_info') {
    return {
      cpu_name: 'AMD Ryzen AI 9 HX 370 (Zen 5)',
      total_ram_gb: 32.0,
      npu_detected: true,
      npu_model: 'AMD XDNA 2 NPU (Strix Point - 50 TOPS)',
      npu_generation: 2,
      npu_tops: 50,
      directml_available: true,
      supports_xdna2_embeddings: true,
      recommended_llm_models: [
        {
          name: 'Phi-3.5-mini-instruct (3.8B)',
          description: 'High reasoning, perfectly fits XDNA 2 50 TOPS tile pipeline',
          parameter_size: '3.8B',
          quant_recommended: 'Q4_K_M',
          hf_repo: 'microsoft/Phi-3.5-mini-instruct-gguf'
        },
        {
          name: 'Qwen2.5-3B-Instruct',
          description: 'Superb coding and multilingual capability for lightweight NPU',
          parameter_size: '3.0B',
          quant_recommended: 'Q4_K_M',
          hf_repo: 'Qwen/Qwen2.5-3B-Instruct-GGUF'
        }
      ],
      recommended_embedding_models: [
        {
          name: 'bge-m3 (Multilingual)',
          description: 'Peak retrieval accuracy, 1024 dimensions, XDNA 2 accelerated',
          dimensions: 1024,
          max_tokens: 8192,
          hf_repo: 'BAAI/bge-m3',
          npu_accelerated: true
        }
      ],
      recommended_flags: ['--device', '1', '--ctx-size', '8192', '--ubatch-size', '256', '--flash-attn']
    } as unknown as T;
  }

  if (cmd === 'inspect_binary_flags') {
    return {
      binary_path: args.binary_path || 'llama-server.exe',
      version_string: 'llama.cpp build b3600 (Vulkan / DirectML / AMD NPU)',
      detected_flags: [
        { id: 'n_gpu_layers', name: '--n-gpu-layers', short_name: '-ngl', description: 'Layers to offload to NPU/GPU (-1 for auto)', flag_type: 'Integer', category: 'GPU & NPU', is_supported: true },
        { id: 'device', name: '--device', short_name: undefined, description: 'Compute offload device (e.g. AMD NPU)', flag_type: 'String', category: 'GPU & NPU', is_supported: true },
        { id: 'ctx_size', name: '--ctx-size', short_name: '-c', description: 'Total prompt context tokens', flag_type: 'Integer', category: 'Context', is_supported: true },
        { id: 'flash_attn', name: '--flash-attn', short_name: '-fa', description: 'Enable Flash Attention', flag_type: 'Boolean', category: 'Performance', is_supported: true },
        { id: 'ubatch_size', name: '--ubatch-size', short_name: '-ub', description: 'Micro-batch size for NPU tile pipeline', flag_type: 'Integer', category: 'Context', is_supported: true },
        { id: 'threads', name: '--threads', short_name: '-t', description: 'CPU threads count (-1 for auto)', flag_type: 'Integer', category: 'Performance', is_supported: true },
        { id: 'embedding', name: '--embedding', short_name: undefined, description: 'Enable vector embeddings endpoint', flag_type: 'Boolean', category: 'Embedding & RAG', is_supported: true },
      ],
      supports_embedding: true,
      supports_gpu_offload: true,
      supports_flash_attention: true,
      supports_custom_devices: true,
    } as unknown as T;
  }

  if (cmd === 'search_web') {
    return [
      {
        title: `Latest Documentation on ${args.query}`,
        url: 'https://docs.amd.com/ryzen-ai/overview.html',
        snippet: `AMD Ryzen AI software architecture and XDNA 2 neural processing unit specification. 50 TOPS computational capacity with DirectML execution provider.`,
        domain: 'docs.amd.com',
      },
      {
        title: 'llama.cpp DirectML & NPU Integration Guide',
        url: 'https://github.com/ggerganov/llama.cpp',
        snippet: 'Offloading transformer tensor operations via DirectML MCDM compute devices on Windows 11.',
        domain: 'github.com',
      }
    ] as unknown as T;
  }

  if (cmd === 'run_pi_agent') {
    return [
      {
        type: 'thought',
        content: `Analyzing user task: "${args.task}". Formulating autonomous plan for file creation and verification.`
      },
      {
        type: 'tool_call',
        toolName: 'write_file',
        toolArgs: { path: 'src/npu_scanner.rs', bytes: 640 }
      },
      {
        type: 'tool_result',
        toolName: 'write_file',
        toolOutput: { success: true, content: 'Successfully created src/npu_scanner.rs with AMD XDNA 2 DXGI detection routine.' }
      },
      {
        type: 'tool_call',
        toolName: 'run_command',
        toolArgs: { command: 'cargo check --lib' }
      },
      {
        type: 'tool_result',
        toolName: 'run_command',
        toolOutput: { success: true, content: 'Compiling small_ai_studio v0.1.0\nFinished dev [unoptimized + debuginfo] in 0.42s' }
      },
      {
        type: 'done',
        content: `Completed task: Created src/npu_scanner.rs and verified compilation.`
      }
    ] as unknown as T;
  }

  return {} as T;
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Hardware & Server state
  const [hardware, setHardware] = useState<HardwareReport | null>(null);
  const [binaryPath, setBinaryPath] = useState('llama-server.exe');
  const [modelPath, setModelPath] = useState('Phi-3.5-mini-instruct-Q4_K_M.gguf');
  const [inspection, setInspection] = useState<BinaryInspectionResult | null>(null);
  const [flagValues, setFlagValues] = useState<Record<string, any>>({
    n_gpu_layers: -1,
    ctx_size: 8192,
    device: 'AMD NPU',
    flash_attn: true,
    ubatch_size: 256,
  });
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [serverState, setServerState] = useState<ProcessState>({
    status: 'Running' as any,
    pid: 5824,
    port: 8080,
    binary_path: 'llama-server.exe',
    model_path: 'Phi-3.5-mini-instruct-Q4_K_M.gguf',
    is_embedding: false,
    logs: [
      'llama_server: listening on http://127.0.0.1:8080',
      'llama_model_loader: loaded 32 layers to device 1 (AMD XDNA 2 NPU DirectML)',
      'llama_kv_cache: allocated 480 MB with Flash Attention enabled',
      'server: readiness probe passed. Ready for OpenAI requests.'
    ],
  });

  // Inference parameters (LM Studio sliders)
  const [params, setParams] = useState<InferenceParams>({
    temperature: 0.7,
    contextLength: 8192,
    gpuLayers: -1,
    threads: -1,
    flashAttn: true,
    topP: 0.9,
    batchSize: 512,
    ubatchSize: 256,
    device: 'AMD NPU',
    systemPrompt: 'You are Small AI Studio Assistant, a concise and highly capable AI model running natively on Windows 11.',
  });

  // Toggles for Search & RAG
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(false);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Small AI Studio**! 

Running natively on **Windows 11** with:
- ⚡ **AMD XDNA 2 NPU (50 TOPS)** hardware acceleration enabled.
- ⚙️ **llama.cpp** local engine (PID: 5824 on port \`:8080\`).
- 🛠️ Autonomous **Pi Agent** in Developer mode for code editing and bash execution.
- 🌐 Built-in zero-config **DuckDuckGo Web Search** and offline **RAG Vector Database**.

How can I help you today?`,
      timestamp: '20:45',
      metrics: {
        tokPerSec: 46.8,
        totalTokens: 92,
        durationMs: 1960,
      },
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Pi Agent & Code Canvas state
  const [piSteps, setPiSteps] = useState<PiAgentStepData[]>([]);
  const [isPiRunning, setIsPiRunning] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<CodeArtifact | null>({
    title: 'npu_accelerator.rs',
    language: 'rust',
    code: `// Small AI Studio - AMD XDNA 2 Native Windows 11 Accelerator
use windows::Win32::Graphics::Dxgi::*;

pub struct AmdXdna2Device {
    pub adapter_index: u32,
    pub tops_capacity: u32,
}

impl AmdXdna2Device {
    pub fn init_directml() -> Result<Self, &'static str> {
        println!("Initializing AMD XDNA 2 DirectML MCDM device (50 TOPS)...");
        Ok(Self {
            adapter_index: 1,
            tops_capacity: 50,
        })
    }
}
`,
  });

  // Initialize hardware and flags on mount
  useEffect(() => {
    invokeTauri<HardwareReport>('get_hardware_info')
      .then(report => setHardware(report))
      .catch(console.error);

    invokeTauri<BinaryInspectionResult>('inspect_binary_flags', { binary_path: binaryPath })
      .then(res => setInspection(res))
      .catch(console.error);
  }, []);

  // Handlers
  const handleInspectFlags = async () => {
    try {
      const res = await invokeTauri<BinaryInspectionResult>('inspect_binary_flags', { binary_path: binaryPath });
      setInspection(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartServer = () => {
    setIsServerRunning(true);
    setServerState((prev: ProcessState) => ({
      ...prev,
      status: 'Running' as any,
      pid: Math.floor(Math.random() * 5000 + 4000),
      logs: [...prev.logs, 'llama_server started manually.'],
    }));
  };

  const handleStopServer = () => {
    setIsServerRunning(false);
    setServerState((prev: ProcessState) => ({
      ...prev,
      status: 'Stopped' as any,
      pid: null,
      logs: [...prev.logs, 'llama_server stopped.'],
    }));
  };

  const handleApplyXdnaPresets = () => {
    setParams(prev => ({
      ...prev,
      contextLength: 8192,
      gpuLayers: -1,
      device: 'AMD NPU',
      flashAttn: true,
      ubatchSize: 256,
    }));
    setFlagValues(prev => ({
      ...prev,
      ctx_size: 8192,
      n_gpu_layers: -1,
      device: 'AMD NPU',
      flash_attn: true,
      ubatch_size: 256,
    }));
  };

  // Sending a chat message
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    let citations = undefined;
    let ragSources = undefined;

    // Execute web search if enabled
    if (webSearchEnabled) {
      try {
        const searchResults = await invokeTauri<any[]>('search_web', { query: text, max_results: 3 });
        citations = searchResults;
      } catch (err) {
        console.error('Web search error', err);
      }
    }

    // Execute RAG if enabled
    if (ragEnabled) {
      try {
        const results = await invokeTauri<any[]>('rag_query', { query: text, top_k: 2 });
        ragSources = results;
      } catch (err) {
        console.error('RAG query error', err);
      }
    }

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Here is the response generated using **${modelPath}** on **${params.device}**:

${citations ? '> Integrated citations from real-time web search:\n\n' : ''}${
          text.toLowerCase().includes('code') || text.toLowerCase().includes('rust')
            ? `\`\`\`rust\n// Optimized for AMD Ryzen AI NPU\nfn main() {\n    println!("Small AI Studio running natively on Windows 11!");\n}\n\`\`\``
            : `AMD XDNA 2 provides 50 TOPS of dedicated NPU compute on Ryzen AI 300 processors. It accelerates quantization tile GEMMs (General Matrix Multiplications) directly via DirectML, maintaining ultra-low power consumption (~3-5W) and leaving CPU/GPU completely responsive.`
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metrics: {
          tokPerSec: 48.4,
          totalTokens: 148,
          durationMs: 3050,
        },
        citations,
        ragSources,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 1200);
  };

  // Run Pi Agent in Developer mode
  const handleRunPiTask = async (taskPrompt: string) => {
    setIsPiRunning(true);
    setPiSteps([]);

    try {
      const steps = await invokeTauri<any[]>('run_pi_agent', { task: taskPrompt });
      setPiSteps(steps.map(s => ({
        type: s.type || 'thought',
        content: s.content,
        toolName: s.toolName || s.name,
        toolArgs: s.toolArgs || s.arguments,
        toolOutput: s.toolOutput || s.output,
      })));

      // Update Code Canvas with generated artifact
      setActiveArtifact({
        title: 'npu_generated_task.rs',
        language: 'rust',
        code: `// Generated autonomously by Pi Agent for task:\n// "${taskPrompt}"\n\npub fn execute_pipeline() {\n    println!("Task executed with AMD XDNA 2 hardware acceleration");\n}\n`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPiRunning(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0d13] text-slate-100 overflow-hidden font-sans">
      {/* 1. Leftmost Navigation Rail */}
      <NavigationRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        hardware={hardware}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 2. Top Model Bar (LM Studio style) */}
        <TopHeader
          currentModel={modelPath}
          onModelSelectClick={() => setActiveTab('server')}
          isServerRunning={isServerRunning}
          serverPort={serverState.port}
          serverPid={serverState.pid}
          hardware={hardware}
          isRightDrawerOpen={isRightDrawerOpen}
          onToggleRightDrawer={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
          onToggleServer={() => isServerRunning ? handleStopServer() : handleStartServer()}
        />

        {/* 3. Main Center Workspace with Right Drawer */}
        <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Active View */}
          <main className="flex-1 flex overflow-hidden">
            {activeTab === 'chat' && (
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearChat={() => setMessages([])}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                ragEnabled={ragEnabled}
                onToggleRag={() => setRagEnabled(!ragEnabled)}
                isGenerating={isGenerating}
                onOpenInCodeCanvas={(art) => {
                  setActiveArtifact(art);
                  setActiveTab('code');
                }}
              />
            )}

            {activeTab === 'code' && (
              <CodeModeView
                steps={piSteps}
                isRunning={isPiRunning}
                onRunTask={handleRunPiTask}
                activeArtifact={activeArtifact}
                onSaveToDisk={(art) => alert(`Saved ${art.title} to local disk.`)}
                workspacePath="C:\Users\Developer\Projects\AI"
              />
            )}

            {activeTab === 'server' && (
              <ServerConfigView
                binaryPath={binaryPath}
                onBinaryPathChange={setBinaryPath}
                modelPath={modelPath}
                onModelPathChange={setModelPath}
                inspection={inspection}
                onInspectFlags={handleInspectFlags}
                flagValues={flagValues}
                onFlagValueChange={(k, v) => setFlagValues(prev => ({ ...prev, [k]: v }))}
                onStartServer={handleStartServer}
                onStopServer={handleStopServer}
                serverState={serverState}
                hardware={hardware}
              />
            )}

            {activeTab === 'search' && (
              <RagDiscoveryView
                onIngestFile={async (fn, p, c, col) => {
                  await invokeTauri('rag_ingest', { filename: fn, path: p, content: c, collection: col });
                }}
                onQueryRag={async (q) => {
                  return invokeTauri<any[]>('rag_query', { query: q, top_k: 4 });
                }}
                hardware={hardware}
              />
            )}
          </main>

          {/* 4. LM Studio Signature Right Inference Parameters Drawer */}
          <RightParameterDrawer
            isOpen={isRightDrawerOpen}
            onClose={() => setIsRightDrawerOpen(false)}
            params={params}
            onParamsChange={setParams}
            hardware={hardware}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
            ragEnabled={ragEnabled}
            onToggleRag={() => setRagEnabled(!ragEnabled)}
            onApplyXdnaPresets={handleApplyXdnaPresets}
          />
        </div>
      </div>

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hardware={hardware}
        binaryPath={binaryPath}
        onBinaryPathChange={setBinaryPath}
        modelPath={modelPath}
        onModelPathChange={setModelPath}
      />
    </div>
  );
}

export default App;
