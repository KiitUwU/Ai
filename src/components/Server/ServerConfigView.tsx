import React, { useState } from 'react';
import { 
  Server, 
  Play, 
  Square, 
  Terminal, 
  FileSearch, 
  Cpu, 
  Zap, 
  Sliders, 
  Folder, 
  Check, 
  RefreshCw, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { CliFlag, BinaryInspectionResult, HardwareReport, ProcessState } from '../../types';

interface ServerConfigViewProps {
  binaryPath: string;
  onBinaryPathChange: (path: string) => void;
  modelPath: string;
  onModelPathChange: (path: string) => void;
  inspection: BinaryInspectionResult | null;
  onInspectFlags: () => void;
  flagValues: Record<string, any>;
  onFlagValueChange: (flagId: string, value: any) => void;
  onStartServer: () => void;
  onStopServer: () => void;
  serverState: ProcessState | null;
  hardware: HardwareReport | null;
}

export const ServerConfigView: React.FC<ServerConfigViewProps> = ({
  binaryPath,
  onBinaryPathChange,
  modelPath,
  onModelPathChange,
  inspection,
  onInspectFlags,
  flagValues,
  onFlagValueChange,
  onStartServer,
  onStopServer,
  serverState,
  hardware,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const isRunning = serverState?.status === 'Running';

  // Construct preview command line
  const generateCommandPreview = () => {
    let parts = [binaryPath || 'llama-server.exe'];
    parts.push(`-m "${modelPath || 'model.gguf'}"`);
    parts.push(`--port ${serverState?.port || 8080}`);

    if (flagValues['n_gpu_layers'] !== undefined) {
      parts.push(`-ngl ${flagValues['n_gpu_layers']}`);
    }
    if (flagValues['ctx_size']) {
      parts.push(`-c ${flagValues['ctx_size']}`);
    }
    if (flagValues['device']) {
      parts.push(`--device "${flagValues['device']}"`);
    }
    if (flagValues['flash_attn']) {
      parts.push(`--flash-attn`);
    }
    if (flagValues['ubatch_size']) {
      parts.push(`-ub ${flagValues['ubatch_size']}`);
    }
    if (flagValues['threads'] && flagValues['threads'] !== -1) {
      parts.push(`-t ${flagValues['threads']}`);
    }

    return parts.join(' ');
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generateCommandPreview());
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0d13] overflow-hidden select-text">
      {/* Top Header */}
      <div className="h-12 border-b border-[#1c212e] px-6 flex items-center justify-between bg-[#12151d]">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Local llama.cpp Server & Flag Inspector
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={onStopServer}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Server</span>
            </button>
          ) : (
            <button
              onClick={onStartServer}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Server</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Binary & Model Selection Card */}
        <div className="p-5 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1c212e] pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Custom Binary & Model Selection</span>
            </h3>
            {hardware?.npu_detected && (
              <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{hardware.npu_model} Ready</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Binary Path */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Custom llama.cpp Binary Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={binaryPath}
                  onChange={(e) => onBinaryPathChange(e.target.value)}
                  placeholder="e.g. C:\llama.cpp\llama-server.exe or ./llama-server"
                  className="flex-1 bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={onInspectFlags}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  title="Run --help and parse all supported flags"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Parse Flags</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Supports upstream, DirectML, Vulkan, SYCL, and custom XDNA builds.
              </p>
            </div>

            {/* Model Path */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                GGUF Model File Path
              </label>
              <input
                type="text"
                value={modelPath}
                onChange={(e) => onModelPathChange(e.target.value)}
                placeholder="e.g. C:\models\Qwen2.5-3B-Instruct-Q4_K_M.gguf"
                className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Local quantized GGUF weights file (Q4_K_M, Q8_0, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic CLI Flags Grid */}
        <div className="p-5 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1c212e] pb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Auto-Parsed CLI Flags Schema</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {inspection?.detected_flags.length || 0} flags parsed automatically from binary `--help`
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-2 py-0.5 rounded ${inspection?.supports_embedding ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                --embedding {inspection?.supports_embedding ? '✓' : '✗'}
              </span>
              <span className={`px-2 py-0.5 rounded ${inspection?.supports_flash_attention ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}>
                --flash-attn {inspection?.supports_flash_attention ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Flags Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspection?.detected_flags.map((flag) => (
              <div
                key={flag.id}
                className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-300 font-semibold">{flag.name}</span>
                  {flag.short_name && (
                    <span className="font-mono text-[10px] text-slate-500 bg-[#0b0d13] px-1.5 py-0.5 rounded">
                      {flag.short_name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{flag.description}</p>

                {/* Input control by flag type */}
                {flag.id === 'n_gpu_layers' && (
                  <input
                    type="number"
                    value={flagValues['n_gpu_layers'] ?? -1}
                    onChange={(e) => onFlagValueChange('n_gpu_layers', parseInt(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#2b3245] rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                )}
                {flag.id === 'ctx_size' && (
                  <input
                    type="number"
                    value={flagValues['ctx_size'] ?? 4096}
                    onChange={(e) => onFlagValueChange('ctx_size', parseInt(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#2b3245] rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                )}
                {flag.id === 'device' && (
                  <input
                    type="text"
                    value={flagValues['device'] ?? 'AMD NPU'}
                    onChange={(e) => onFlagValueChange('device', e.target.value)}
                    placeholder="e.g. AMD NPU or 1"
                    className="w-full bg-[#0b0d13] border border-[#2b3245] rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                )}
                {flag.id === 'flash_attn' && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={flagValues['flash_attn'] ?? true}
                      onChange={(e) => onFlagValueChange('flash_attn', e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-300">Enable Flash Attention</span>
                  </label>
                )}
                {flag.id !== 'n_gpu_layers' && flag.id !== 'ctx_size' && flag.id !== 'device' && flag.id !== 'flash_attn' && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Category: {flag.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Command Line Preview */}
        <div className="p-4 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Generated Process Invocation String
            </span>
            <button
              onClick={copyCommand}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-mono"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy CLI</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-[#0b0d13] border border-[#1c212e] text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap break-all">
            {generateCommandPreview()}
          </pre>
        </div>

        {/* Live Process Logs Console */}
        <div className="p-4 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Real-time Process Logs (STDOUT / STDERR)</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Win32 Job Object Guard: Active
            </span>
          </div>
          <div className="h-48 p-3 rounded-xl bg-[#0b0d13] border border-[#1c212e] text-xs font-mono text-slate-300 overflow-y-auto space-y-1">
            {serverState?.logs.length ? (
              serverState.logs.map((log: string, i: number) => (
                <div key={i} className="text-slate-300 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-600">
                [Logs will stream here when server is started...]
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
