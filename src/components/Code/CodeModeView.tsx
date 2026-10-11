import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Terminal, 
  FileCode, 
  Folder, 
  Check, 
  Copy, 
  Save, 
  GitCompare, 
  Brain, 
  Wrench, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  ExternalLink,
  Zap
} from 'lucide-react';
import { CodeArtifact, PiAgentStepData } from '../../types';

interface CodeModeViewProps {
  steps: PiAgentStepData[];
  isRunning: boolean;
  onRunTask: (taskPrompt: string) => void;
  activeArtifact: CodeArtifact | null;
  onSaveToDisk: (artifact: CodeArtifact) => void;
  workspacePath: string;
}

export const CodeModeView: React.FC<CodeModeViewProps> = ({
  steps,
  isRunning,
  onRunTask,
  activeArtifact,
  onSaveToDisk,
  workspacePath,
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'diff' | 'terminal'>('editor');
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || isRunning) return;
    onRunTask(taskInput.trim());
  };

  const copyCode = () => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex h-full bg-[#0b0d13] overflow-hidden select-text">
      {/* LEFT PANE: Pi Agent Execution Stream (45% width) */}
      <div className="w-[45%] border-r border-[#1c212e] flex flex-col h-full bg-[#12151d]">
        {/* Workspace Breadcrumb & Header */}
        <div className="h-10 border-b border-[#1c212e] px-4 flex items-center justify-between text-xs text-slate-400 bg-[#0e1017]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-200">Pi Agent Developer Loop</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
            <Folder className="w-3 h-3 text-cyan-400" />
            <span className="max-w-[150px] truncate">{workspacePath || '.'}</span>
          </div>
        </div>

        {/* Steps Timeline Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto text-slate-400 select-none">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Pi Coding Agent Ready</h3>
              <p className="text-xs text-slate-500 mb-4">
                Enter an autonomous programming task. Pi Agent will read files, run terminal commands, and draft code.
              </p>
              <div className="space-y-2 w-full text-left">
                <button
                  onClick={() => onRunTask("Create a Rust module with DirectML hardware scanner")}
                  className="w-full p-2.5 rounded bg-[#171b26] hover:bg-[#1f2433] border border-[#2b3245] text-xs text-slate-300 transition-colors"
                >
                  ⚡ DirectML NPU scanner in Rust
                </button>
                <button
                  onClick={() => onRunTask("Create a Python script for testing llama-server API")}
                  className="w-full p-2.5 rounded bg-[#171b26] hover:bg-[#1f2433] border border-[#2b3245] text-xs text-slate-300 transition-colors"
                >
                  🐍 Python test script for /v1/chat/completions
                </button>
              </div>
            </div>
          ) : (
            steps.map((step, idx) => {
              const isExpanded = expandedSteps[idx] ?? true;

              if (step.type === 'thought') {
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] space-y-1.5">
                    <div 
                      onClick={() => toggleStep(idx)}
                      className="flex items-center gap-2 text-xs font-semibold text-indigo-400 cursor-pointer select-none"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Pi Agent Reasoning</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                    </div>
                    {isExpanded && (
                      <p className="text-xs text-slate-300 font-mono leading-relaxed pl-6">
                        {step.content}
                      </p>
                    )}
                  </div>
                );
              }

              if (step.type === 'tool_call') {
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#171b26] border border-blue-500/30 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-blue-400 font-medium">
                        <Wrench className="w-3.5 h-3.5" />
                        <span className="font-mono">Tool Call: {step.toolName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
                        RUNNING
                      </span>
                    </div>
                    <pre className="p-2 rounded bg-[#0b0d13] text-[11px] font-mono text-slate-300 overflow-x-auto border border-[#1c212e]">
                      {JSON.stringify(step.toolArgs, null, 2)}
                    </pre>
                  </div>
                );
              }

              if (step.type === 'tool_result') {
                const output = step.toolOutput;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#171b26] border border-emerald-500/30 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span className="font-mono">Output: {step.toolName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                        SUCCESS
                      </span>
                    </div>
                    <pre className="p-2 rounded bg-[#0b0d13] text-[11px] font-mono text-emerald-300/90 overflow-x-auto border border-[#1c212e] max-h-40">
                      {output?.content || JSON.stringify(output)}
                    </pre>
                  </div>
                );
              }

              if (step.type === 'done') {
                return (
                  <div key={idx} className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-[#171b26] border border-blue-500/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Task Completed</span>
                    </div>
                    <p className="text-xs text-slate-200 pl-6 leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Bottom Task Input Box */}
        <div className="p-3 bg-[#0e1017] border-t border-[#1c212e]">
          <form onSubmit={handleRun} className="flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Ask Pi Agent to write code or run a task..."
              className="flex-1 bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!taskInput.trim() || isRunning}
              className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                taskInput.trim() && !isRunning
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#1f2433] text-slate-500 cursor-not-allowed'
              }`}
            >
              {isRunning ? <Square className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Running' : 'Run'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANE: Code Canvas & Editor (55% width) */}
      <div className="flex-1 flex flex-col h-full bg-[#0b0d13]">
        {/* Code Canvas Tab Bar */}
        <div className="h-10 border-b border-[#1c212e] px-4 flex items-center justify-between bg-[#12151d]">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-t-lg bg-[#171b26] border-t-2 border-blue-500 text-xs font-mono text-slate-200 flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeArtifact?.title || 'No file opened'}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'diff' ? 'editor' : 'diff')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors border ${
                activeTab === 'diff'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : 'bg-[#171b26] text-slate-400 border-[#2b3245] hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff</span>
            </button>
            <button
              onClick={copyCode}
              disabled={!activeArtifact}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#171b26] hover:bg-[#1f2433] text-slate-300 border border-[#2b3245] text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
            <button
              onClick={() => activeArtifact && onSaveToDisk(activeArtifact)}
              disabled={!activeArtifact}
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-md shadow-emerald-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save to Disk</span>
            </button>
          </div>
        </div>

        {/* Editor Code Canvas */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-[#0b0d13] text-slate-200">
          {activeArtifact ? (
            <div className="flex">
              {/* Line Numbers */}
              <div className="pr-4 text-right text-slate-600 select-none font-mono">
                {activeArtifact.code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Code Content */}
              <pre className="flex-1 text-slate-200 overflow-x-auto">
                <code>{activeArtifact.code}</code>
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 select-none">
              <FileCode className="w-12 h-12 mb-2 text-slate-600" />
              <p className="text-xs">No active file generated yet.</p>
              <p className="text-[11px] text-slate-600">Run a task in Pi Agent to generate or edit code here.</p>
            </div>
          )}
        </div>

        {/* Bottom Terminal Drawer (LM Studio Developer style) */}
        <div className="h-40 border-t border-[#1c212e] bg-[#0e1017] flex flex-col">
          <div className="h-7 border-b border-[#1c212e] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#12151d]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>Embedded Terminal Output</span>
            </span>
            <span className="text-emerald-400 text-[10px]">Ready</span>
          </div>
          <div className="flex-1 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
            <div className="text-slate-500">$ # Commands executed by Pi Agent will appear here in real-time</div>
            {steps
              .filter(s => s.type === 'tool_result' && s.toolName === 'run_command')
              .map((s, i) => (
                <div key={i} className="text-slate-200 whitespace-pre-wrap">
                  {s.toolOutput?.content}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
