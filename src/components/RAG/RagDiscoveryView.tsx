import React, { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  FileText, 
  FileCode, 
  Zap, 
  Trash2, 
  CheckCircle, 
  Sparkles,
  Layers
} from 'lucide-react';
import { RagSearchResult, HardwareReport } from '../../types';

interface IngestedDoc {
  id: number;
  filename: string;
  path: string;
  chunks: number;
  date: string;
}

interface RagDiscoveryViewProps {
  onIngestFile: (filename: string, path: string, content: string, collection: string) => Promise<void>;
  onQueryRag: (query: string) => Promise<RagSearchResult[]>;
  hardware: HardwareReport | null;
}

export const RagDiscoveryView: React.FC<RagDiscoveryViewProps> = ({
  onIngestFile,
  onQueryRag,
  hardware,
}) => {
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [collection, setCollection] = useState('Default');
  const [isIngesting, setIsIngesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RagSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [documents, setDocuments] = useState<IngestedDoc[]>([
    {
      id: 1,
      filename: 'xdna2_architecture_guide.md',
      path: '/docs/xdna2_guide.md',
      chunks: 8,
      date: 'Today, 20:45',
    },
    {
      id: 2,
      filename: 'llama_cpp_directml_setup.rs',
      path: '/src/hardware/directml.rs',
      chunks: 5,
      date: 'Today, 20:40',
    },
  ]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim() || isIngesting) return;

    setIsIngesting(true);
    try {
      await onIngestFile(docName.trim(), `/workspace/${docName.trim()}`, docContent, collection);
      setDocuments(prev => [
        {
          id: Date.now(),
          filename: docName.trim(),
          path: `/workspace/${docName.trim()}`,
          chunks: Math.ceil(docContent.length / 500),
          date: 'Just now',
        },
        ...prev,
      ]);
      setDocName('');
      setDocContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const res = await onQueryRag(searchQuery.trim());
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0d13] overflow-hidden select-text">
      {/* Top Bar */}
      <div className="h-12 border-b border-[#1c212e] px-6 flex items-center justify-between bg-[#12151d]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Knowledge Base & RAG Vector Engine
          </h2>
        </div>
        {hardware?.npu_detected && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>XDNA 2 Embedding: BAAI/bge-m3 Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* NPU Vector Acceleration Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#171b26] to-emerald-950/30 border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Native Offline Vector Database (SQLite + Cosine SIMD)</span>
            </div>
            <p className="text-xs text-slate-400">
              Documents are automatically chunked and embedded via local models. Zero telemetry, 100% private.
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>Vector Dims: <span className="text-cyan-400">1024</span></div>
            <div>Latency: <span className="text-emerald-400">~1.5ms/chunk</span></div>
          </div>
        </div>

        {/* Ingest Document Card */}
        <div className="p-5 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-4 shadow-lg">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-[#1c212e] pb-3">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Ingest Document or Code into Vector Store</span>
          </h3>

          <form onSubmit={handleIngest} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Document / File Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. api_spec.md, engine.rs, notes.txt"
                  className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Collection Tag
                </label>
                <input
                  type="text"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="e.g. Project Docs, Workspace"
                  className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Document Content / Text
              </label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                rows={5}
                placeholder="Paste documentation, source code, or articles here..."
                className="w-full bg-[#171b26] border border-[#2b3245] rounded-xl p-3 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!docName.trim() || !docContent.trim() || isIngesting}
                className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  docName.trim() && docContent.trim() && !isIngesting
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-[#1f2433] text-slate-500 cursor-not-allowed'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isIngesting ? 'Chunking & Embedding...' : 'Index Document'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Ingested Documents List */}
        <div className="p-5 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-3 shadow-lg">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-[#1c212e] pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Indexed Documents ({documents.length})</span>
          </h3>

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl bg-[#171b26] border border-[#2b3245] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-slate-200 font-medium block">
                      {doc.filename}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {doc.path} • {doc.chunks} chunks • {doc.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Vectorized
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Search Tester */}
        <div className="p-5 rounded-2xl bg-[#12151d] border border-[#1c212e] space-y-4 shadow-lg">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-[#1c212e] pb-3">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Test Semantic Vector Search</span>
          </h3>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query the vector database to test similarity scoring..."
              className="flex-1 bg-[#171b26] border border-[#2b3245] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0b0d13] border border-[#1c212e] space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-cyan-400 font-semibold">{res.document_name}</span>
                    <span className="text-emerald-400">{(res.score * 100).toFixed(1)}% Match</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                    {res.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
