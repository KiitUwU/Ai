import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Folder, 
  Server, 
  Zap, 
  Search, 
  ShieldCheck, 
  HardDrive,
  Cpu,
  Info
} from 'lucide-react';
import { HardwareReport } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardware: HardwareReport | null;
  binaryPath: string;
  onBinaryPathChange: (path: string) => void;
  modelPath: string;
  onModelPathChange: (path: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hardware,
  binaryPath,
  onBinaryPathChange,
  modelPath,
  onModelPathChange,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'hardware' | 'search' | 'about'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#12151d] border border-[#262c3e] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[#262c3e] px-6 flex items-center justify-between bg-[#161a26]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-100">Small AI Studio Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#23293c] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation */}
          <div className="w-48 border-r border-[#262c3e] bg-[#0e1017] p-3 space-y-1 text-xs">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'general'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#171b26]'
              }`}
            >
              General & Binaries
            </button>
            <button
              onClick={() => setActiveSection('hardware')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'hardware'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#171b26]'
              }`}
            >
              AMD XDNA 2 & Hardware
            </button>
            <button
              onClick={() => setActiveSection('search')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'search'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#171b26]'
              }`}
            >
              Web Search & Privacy
            </button>
            <button
              onClick={() => setActiveSection('about')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'about'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#171b26]'
              }`}
            >
              About
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
            {activeSection === 'general' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-200 block">Default llama.cpp Path</label>
                  <input
                    type="text"
                    value={binaryPath}
                    onChange={(e) => onBinaryPathChange(e.target.value)}
                    className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Path to custom `llama-server.exe`</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-200 block">Default Model Path</label>
                  <input
                    type="text"
                    value={modelPath}
                    onChange={(e) => onModelPathChange(e.target.value)}
                    className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Local GGUF model path</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-1 font-mono">
                    <span className="text-[11px] text-slate-400 block">REST API Port</span>
                    <span className="text-cyan-400 font-bold text-sm">8080</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-1 font-mono">
                    <span className="text-[11px] text-slate-400 block">Embedding Server Port</span>
                    <span className="text-emerald-400 font-bold text-sm">8081</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'hardware' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#171b26] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>{hardware?.npu_model || 'AMD Ryzen AI NPU'}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Windows 11 DirectML compute accelerator ready. Hardware TOPS: <span className="font-mono text-emerald-400 font-bold">{hardware?.npu_tops || 50} TOPS</span>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245]">
                    <span className="text-slate-500 text-[11px] block">CPU Topology</span>
                    <span className="text-slate-200 font-medium">{hardware?.cpu_name}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245]">
                    <span className="text-slate-500 text-[11px] block">System Memory</span>
                    <span className="text-cyan-400 font-medium">{hardware?.total_ram_gb || 32} GB RAM</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'search' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-1">
                  <span className="font-semibold text-slate-200 block">Zero-Config Search Engine</span>
                  <p className="text-[11px] text-slate-400">
                    Queries are processed directly through DuckDuckGo HTML parsing. No external API keys or subscriptions required.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-1">
                  <span className="font-semibold text-slate-200 block">Readability Web Scraper</span>
                  <p className="text-[11px] text-slate-400">
                    Strips scripts, styling, and navigation boilerplate, delivering clean Markdown text directly to model context.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-3 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Small AI Studio</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Lightweight, native Windows 11 AI studio built with Rust & Tauri 2.0. Inspired by LM Studio ergonomics and Claude Code Canvas.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2">
                  Version 0.1.0 • Built with Rust + React + Tailwind
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
