import React from 'react';
import { 
  MessageSquare, 
  Terminal, 
  Search, 
  Server, 
  Settings, 
  Cpu, 
  Sparkles,
  Zap
} from 'lucide-react';
import { NavigationTab, HardwareReport } from '../types';

interface NavigationRailProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  hardware: HardwareReport | null;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onTabChange,
  hardware,
}) => {
  const navItems = [
    { id: 'chat' as NavigationTab, label: 'Chat', icon: MessageSquare },
    { id: 'code' as NavigationTab, label: 'Developer / Pi Agent', icon: Terminal },
    { id: 'search' as NavigationTab, label: 'Web & RAG', icon: Search },
    { id: 'server' as NavigationTab, label: 'Local Server & Flags', icon: Server },
  ];

  return (
    <aside className="w-16 flex flex-col items-center justify-between py-4 bg-[#10131c] border-r border-[#262c3e] z-30 select-none">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <div 
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 cursor-pointer"
          title="Small AI Studio"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2c]'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
                )}
                {/* Tooltip */}
                <div className="absolute left-16 px-2.5 py-1 bg-[#1a1f2c] text-xs text-slate-200 rounded border border-[#2d3449] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Icons: NPU status & Settings */}
      <div className="flex flex-col items-center gap-3">
        {/* AMD XDNA / XDNA 2 Badge */}
        {hardware?.npu_detected && (
          <div 
            className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group relative cursor-pointer"
            title={`${hardware.npu_model} (${hardware.npu_tops} TOPS)`}
          >
            <Zap className="w-5 h-5 animate-pulse" />
            <div className="absolute left-16 px-2.5 py-1 bg-[#1a1f2c] text-xs text-emerald-300 rounded border border-emerald-500/40 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {hardware.npu_model} ({hardware.npu_tops} TOPS) Active
            </div>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => onTabChange('settings')}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-150 relative group ${
            activeTab === 'settings'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2c]'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          <div className="absolute left-16 px-2.5 py-1 bg-[#1a1f2c] text-xs text-slate-200 rounded border border-[#2d3449] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Settings
          </div>
        </button>
      </div>
    </aside>
  );
};
