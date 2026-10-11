import React from 'react';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  Activity, 
  Zap, 
  HardDrive, 
  Cpu,
  Power
} from 'lucide-react';
import { HardwareReport } from '../types';

interface TopHeaderProps {
  currentModel: string;
  onModelSelectClick: () => void;
  isServerRunning: boolean;
  serverPort: number;
  serverPid: number | null;
  hardware: HardwareReport | null;
  isRightDrawerOpen: boolean;
  onToggleRightDrawer: () => void;
  onToggleServer: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentModel,
  onModelSelectClick,
  isServerRunning,
  serverPort,
  serverPid,
  hardware,
  isRightDrawerOpen,
  onToggleRightDrawer,
  onToggleServer,
}) => {
  return (
    <header className="h-14 bg-[#131722] border-b border-[#262c3e] px-4 flex items-center justify-between z-20 select-none">
      {/* Left: App Title & Status */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-100 tracking-wide text-sm flex items-center gap-2">
          <span className="text-blue-400 font-bold">Small AI</span> Studio
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c2230] text-slate-400 border border-[#2d3548]">
          v0.1.0 • Win11 Native
        </span>
      </div>

      {/* Center: LM Studio Signature Model Loader Pill */}
      <div className="flex items-center">
        <button
          onClick={onModelSelectClick}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#22293a] border border-[#2d3449] transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isServerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-mono text-slate-200 font-medium max-w-[200px] truncate">
              {currentModel || 'Select Model...'}
            </span>
          </div>

          <div className="h-4 w-px bg-[#2d3449]" />

          {/* Memory / Hardware Badge */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>RAM 1.8GB</span>
            </span>
            {hardware?.npu_detected && (
              <span className="flex items-center gap-1 text-emerald-400 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Zap className="w-3 h-3" />
                <span>XDNA 2 (50T)</span>
              </span>
            )}
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
        </button>
      </div>

      {/* Right: Server Status Pill & Parameter Drawer Toggle */}
      <div className="flex items-center gap-3">
        {/* Server Toggle Button */}
        <button
          onClick={onToggleServer}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            isServerRunning
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-[#1a1f2c] border-[#2d3449] text-slate-400 hover:text-slate-200'
          }`}
          title={isServerRunning ? 'Stop Server' : 'Start Server'}
        >
          <Power className={`w-3.5 h-3.5 ${isServerRunning ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>
            {isServerRunning ? `:${serverPort} (PID ${serverPid || 'active'})` : 'Server Stopped'}
          </span>
        </button>

        {/* Inference Parameters Toggle Drawer */}
        <button
          onClick={onToggleRightDrawer}
          className={`p-2 rounded-lg transition-all border ${
            isRightDrawerOpen
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-sm'
              : 'bg-[#1a1f2c] border-[#2d3449] text-slate-400 hover:text-slate-200 hover:bg-[#22293a]'
          }`}
          title="Inference Parameters (LM Studio Drawer)"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
