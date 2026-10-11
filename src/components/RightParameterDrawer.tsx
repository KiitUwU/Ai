import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Zap, 
  Search, 
  BookOpen, 
  Sliders, 
  FileText, 
  Gauge, 
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { InferenceParams, HardwareReport } from '../types';

interface RightParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  params: InferenceParams;
  onParamsChange: (newParams: InferenceParams) => void;
  hardware: HardwareReport | null;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  ragEnabled: boolean;
  onToggleRag: () => void;
  onApplyXdnaPresets: () => void;
}

export const RightParameterDrawer: React.FC<RightParameterDrawerProps> = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
  hardware,
  webSearchEnabled,
  onToggleWebSearch,
  ragEnabled,
  onToggleRag,
  onApplyXdnaPresets,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'system' | 'rag' | 'hardware'>('params');

  if (!isOpen) return null;

  const updateParam = <K extends keyof InferenceParams>(key: K, value: InferenceParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <aside className="w-80 bg-[#131722] border-l border-[#262c3e] flex flex-col h-full z-20 select-none shadow-2xl">
      {/* Drawer Header */}
      <div className="h-14 border-b border-[#262c3e] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Inference Settings</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#1f2537] text-slate-400 hover:text-slate-200 transition-colors"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LM Studio Tab Bar */}
      <div className="flex border-b border-[#262c3e] bg-[#0f121a] px-2 text-xs">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === 'params'
              ? 'border-blue-500 text-blue-400 bg-[#161a26]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === 'system'
              ? 'border-blue-500 text-blue-400 bg-[#161a26]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          System
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === 'rag'
              ? 'border-blue-500 text-blue-400 bg-[#161a26]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Search & RAG
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === 'hardware'
              ? 'border-blue-500 text-blue-400 bg-[#161a26]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          XDNA 2
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-slate-300">
        {activeTab === 'params' && (
          <div className="space-y-5">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Temperature</label>
                <span className="font-mono bg-[#1c2130] px-2 py-0.5 rounded text-blue-400 border border-[#2d3548]">
                  {params.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={params.temperature}
                onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#23293c] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-[11px] text-slate-500">Lower values = more focused & deterministic</p>
            </div>

            {/* Context Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Context Length</label>
                <span className="font-mono bg-[#1c2130] px-2 py-0.5 rounded text-cyan-400 border border-[#2d3548]">
                  {params.contextLength} tokens
                </span>
              </div>
              <input
                type="range"
                min="2048"
                max="32768"
                step="1024"
                value={params.contextLength}
                onChange={(e) => updateParam('contextLength', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#23293c] rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2k</span>
                <span>8k (XDNA2)</span>
                <span>32k</span>
              </div>
            </div>

            {/* GPU / NPU Layers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Offload Layers (-ngl)</label>
                <span className="font-mono bg-[#1c2130] px-2 py-0.5 rounded text-emerald-400 border border-[#2d3548]">
                  {params.gpuLayers === -1 ? 'Auto / All' : params.gpuLayers}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="64"
                step="1"
                value={params.gpuLayers}
                onChange={(e) => updateParam('gpuLayers', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#23293c] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500">Layers pushed to NPU/GPU (-1 = maximize hardware)</p>
            </div>

            {/* Acceleration Device Dropdown */}
            <div className="space-y-2">
              <label className="font-medium text-slate-200">Compute Device</label>
              <select
                value={params.device}
                onChange={(e) => updateParam('device', e.target.value)}
                className="w-full bg-[#1c2130] border border-[#2d3548] rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="AMD NPU">AMD XDNA 2 (DirectML NPU)</option>
                <option value="DirectML">DirectML (GPU & NPU Hybrid)</option>
                <option value="Vulkan">Vulkan (Radeon iGPU/dGPU)</option>
                <option value="CPU">CPU (AVX-512 / AVX2)</option>
              </select>
            </div>

            {/* Flash Attention Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-[#262c3e]">
              <div>
                <span className="font-medium text-slate-200 block">Flash Attention</span>
                <span className="text-[11px] text-slate-500">Reduces VRAM by 30-50%</span>
              </div>
              <button
                onClick={() => updateParam('flashAttn', !params.flashAttn)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  params.flashAttn ? 'bg-blue-600' : 'bg-[#23293c]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    params.flashAttn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Threads Stepper */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">CPU Threads</label>
                <span className="font-mono bg-[#1c2130] px-2 py-0.5 rounded text-slate-300">
                  {params.threads === -1 ? 'Auto' : params.threads}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="32"
                step="1"
                value={params.threads}
                onChange={(e) => updateParam('threads', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#23293c] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-slate-200">System Prompt</label>
              <textarea
                value={params.systemPrompt}
                onChange={(e) => updateParam('systemPrompt', e.target.value)}
                rows={8}
                className="w-full bg-[#1c2130] border border-[#2d3548] rounded-lg p-2.5 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-blue-500"
                placeholder="Enter system prompt instructions..."
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Quick Presets
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => updateParam('systemPrompt', 'You are Small AI Studio Assistant, a concise and highly capable AI model running natively on Windows 11.')}
                  className="px-2.5 py-1.5 bg-[#1c2130] hover:bg-[#23293c] rounded text-left border border-[#2d3548] text-[11px] text-slate-300"
                >
                  💬 Helpful Assistant
                </button>
                <button
                  onClick={() => updateParam('systemPrompt', 'You are Pi Agent, an expert autonomous software engineer. Generate clean code, precise file paths, and accurate diffs.')}
                  className="px-2.5 py-1.5 bg-[#1c2130] hover:bg-[#23293c] rounded text-left border border-[#2d3548] text-[11px] text-slate-300"
                >
                  💻 Pi Agent (Code Mode)
                </button>
                <button
                  onClick={() => updateParam('systemPrompt', 'Answer concisely in bullet points. Only output critical insights without conversational filler.')}
                  className="px-2.5 py-1.5 bg-[#1c2130] hover:bg-[#23293c] rounded text-left border border-[#2d3548] text-[11px] text-slate-300"
                >
                  ⚡ Concise & Fast
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rag' && (
          <div className="space-y-5">
            {/* Web Search Toggle */}
            <div className="p-3 rounded-lg bg-[#1c2130] border border-[#2d3548] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-slate-200">DuckDuckGo Web Search</span>
                </div>
                <button
                  onClick={onToggleWebSearch}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    webSearchEnabled ? 'bg-cyan-500' : 'bg-[#23293c]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      webSearchEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero-config search + real-time page scraper. Injects relevant web summaries and citations.
              </p>
            </div>

            {/* Knowledge Base RAG Toggle */}
            <div className="p-3 rounded-lg bg-[#1c2130] border border-[#2d3548] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-slate-200">Knowledge Base RAG</span>
                </div>
                <button
                  onClick={onToggleRag}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    ragEnabled ? 'bg-amber-500' : 'bg-[#23293c]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      ragEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Local SQLite vector database. Cosine similarity semantic search over ingested project files and documents.
              </p>
            </div>

            {/* Embedding Acceleration */}
            <div className="space-y-2">
              <label className="font-medium text-slate-200 block">Embedding Model (XDNA 2)</label>
              <div className="p-2.5 rounded bg-[#161a26] border border-[#2d3548] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-200 block">BAAI/bge-m3</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>NPU Accelerated (~1.5ms/chunk)</span>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  50 TOPS
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hardware' && (
          <div className="space-y-5">
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-950/40 to-[#1c2130] border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Zap className="w-4 h-4" />
                <span>{hardware?.npu_model || 'AMD XDNA 2 NPU'}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Strix Point Ryzen AI 300 architecture detected. 50 TOPS compute acceleration active for LLM matrix operations & vector embeddings.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#141824] p-2 rounded border border-[#262c3e]">
                  <span className="text-slate-500 block">NPU TOPS</span>
                  <span className="text-emerald-400 font-bold">{hardware?.npu_tops || 50} TOPS</span>
                </div>
                <div className="bg-[#141824] p-2 rounded border border-[#262c3e]">
                  <span className="text-slate-500 block">DirectML</span>
                  <span className="text-cyan-400 font-bold">Supported</span>
                </div>
              </div>

              <button
                onClick={onApplyXdnaPresets}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Optimized XDNA 2 Presets</span>
              </button>
            </div>

            {/* Recommended Models */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Recommended NPU Models
              </span>
              {hardware?.recommended_llm_models.map((m, i) => (
                <div key={i} className="p-2.5 rounded bg-[#1c2130] border border-[#2d3548] space-y-1">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-slate-200 font-medium">{m.name}</span>
                    <span className="text-cyan-400 text-[10px]">{m.quant_recommended}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
