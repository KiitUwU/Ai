import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Search, 
  BookOpen, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  Sparkles,
  Zap,
  Globe,
  FileCode
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, SearchResult, RagSearchResult, CodeArtifact } from '../../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onClearChat: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  ragEnabled: boolean;
  onToggleRag: () => void;
  isGenerating: boolean;
  onOpenInCodeCanvas: (artifact: CodeArtifact) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  webSearchEnabled,
  onToggleWebSearch,
  ragEnabled,
  onToggleRag,
  isGenerating,
  onOpenInCodeCanvas,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#161a26] overflow-hidden select-text">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto select-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-xl">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Small AI Studio
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Lightweight native desktop environment powered by local <span className="text-blue-400 font-mono">llama.cpp</span> and <span className="text-emerald-400 font-mono">AMD XDNA 2</span> NPU.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full text-left">
              <button
                onClick={() => onSendMessage("Explain how AMD XDNA 2 accelerates lightweight models")}
                className="p-3 rounded-xl bg-[#1c2130] hover:bg-[#23293c] border border-[#2d3548] text-xs text-slate-300 transition-all hover:border-blue-500/40"
              >
                ⚡ <span className="font-medium text-slate-200">XDNA 2 Architecture</span>
                <span className="block text-[11px] text-slate-400 mt-1">Explore 50 TOPS NPU offload</span>
              </button>
              <button
                onClick={() => onSendMessage("Write a Rust CLI tool with clap and tokio")}
                className="p-3 rounded-xl bg-[#1c2130] hover:bg-[#23293c] border border-[#2d3548] text-xs text-slate-300 transition-all hover:border-blue-500/40"
              >
                🦀 <span className="font-medium text-slate-200">Rust CLI Starter</span>
                <span className="block text-[11px] text-slate-400 mt-1">Generate multi-threaded code</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-2 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Meta Info */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1 font-mono">
                <span className="font-medium text-slate-300">
                  {msg.role === 'user' ? 'You' : 'Assistant (Local Model)'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.metrics && (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    <Zap className="w-2.5 h-2.5" />
                    <span>{msg.metrics.tokPerSec} tok/s</span>
                  </span>
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-[#1c2130] text-slate-200 border border-[#2d3548] rounded-bl-sm'
                }`}
              >
                <div className="prose prose-invert max-w-none prose-pre:bg-[#12151f] prose-pre:border prose-pre:border-[#262c3e] prose-pre:rounded-xl">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        if (!inline && match) {
                          return (
                            <div className="relative group my-3 rounded-xl overflow-hidden border border-[#2a3246] bg-[#12151f]">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#171b28] border-b border-[#262c3e] text-xs font-mono text-slate-400">
                                <span className="text-cyan-400">{match[1]}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onOpenInCodeCanvas({
                                      title: `snippet.${match[1] === 'rust' ? 'rs' : match[1] === 'python' ? 'py' : 'txt'}`,
                                      language: match[1],
                                      code: codeString,
                                    })}
                                    className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                                    title="Open in Code Canvas"
                                  >
                                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Canvas</span>
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(codeString, msg.id + match[1])}
                                    className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                                  >
                                    {copiedId === msg.id + match[1] ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                    <span>Copy</span>
                                  </button>
                                </div>
                              </div>
                              <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <code className="bg-[#242b3d] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Citations / Search Sources */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#2d3548]/60 space-y-2">
                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3" />
                      <span>Web Sources ({msg.citations.length})</span>
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-[#141824] hover:bg-[#1a2030] border border-[#262c3e] flex items-start justify-between gap-3 text-xs text-slate-300 transition-colors"
                        >
                          <div>
                            <span className="font-medium text-blue-400 block truncate max-w-[400px]">
                              {c.title}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {c.snippet}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* RAG Document Sources */}
                {msg.ragSources && msg.ragSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#2d3548]/60 space-y-2">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <BookOpen className="w-3 h-3" />
                      <span>Knowledge Base References ({msg.ragSources.length})</span>
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.ragSources.map((r, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-[#141824] border border-[#262c3e] text-xs text-slate-300"
                        >
                          <div className="flex justify-between items-center font-mono text-[10px] text-slate-400 mb-1">
                            <span className="text-amber-400 font-medium">{r.document_name}</span>
                            <span>Score: {(r.score * 100).toFixed(1)}%</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer Bar */}
      <div className="p-4 bg-[#131722] border-t border-[#262c3e]">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Filter Pills */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleWebSearch}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all border ${
                  webSearchEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-[#1c2130] text-slate-400 border-[#2d3548] hover:text-slate-200'
                }`}
              >
                <Search className="w-3 h-3" />
                <span>Web Search {webSearchEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={onToggleRag}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all border ${
                  ragEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#1c2130] text-slate-400 border-[#2d3548] hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Knowledge RAG {ragEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={onClearChat}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors font-mono"
                title="Clear Chat History"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or enter a task... (Press Enter to send, Shift+Enter for newline)"
              rows={2}
              className="w-full bg-[#1c2130] border border-[#2d3548] rounded-2xl pl-4 pr-14 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={`absolute right-3 p-2.5 rounded-xl transition-all ${
                input.trim() && !isGenerating
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#23293c] text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
