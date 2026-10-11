export type NavigationTab = 'chat' | 'code' | 'search' | 'server' | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metrics?: {
    tokPerSec: number;
    totalTokens: number;
    durationMs: number;
  };
  citations?: SearchResult[];
  ragSources?: RagSearchResult[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface RagSearchResult {
  chunk_id: number;
  document_name: string;
  file_path: string;
  chunk_index: number;
  text: string;
  score: number;
}

export interface HardwareReport {
  cpu_name: string;
  total_ram_gb: number;
  npu_detected: boolean;
  npu_model: string;
  npu_generation: number;
  npu_tops: number;
  directml_available: boolean;
  supports_xdna2_embeddings: boolean;
  recommended_llm_models: ModelRecommendation[];
  recommended_embedding_models: EmbeddingRecommendation[];
  recommended_flags: string[];
}

export interface ModelRecommendation {
  name: string;
  description: string;
  parameter_size: string;
  quant_recommended: string;
  hf_repo: string;
}

export interface EmbeddingRecommendation {
  name: string;
  description: string;
  dimensions: number;
  max_tokens: number;
  hf_repo: string;
  npu_accelerated: boolean;
}

export interface CliFlag {
  id: string;
  name: string;
  short_name?: string;
  description: string;
  flag_type: any;
  category: string;
  is_supported: boolean;
  current_value?: any;
}

export interface BinaryInspectionResult {
  binary_path: string;
  version_string: string;
  detected_flags: CliFlag[];
  supports_embedding: boolean;
  supports_gpu_offload: boolean;
  supports_flash_attention: boolean;
  supports_custom_devices: boolean;
}

export interface InferenceParams {
  temperature: number;
  contextLength: number;
  gpuLayers: number;
  threads: number;
  flashAttn: boolean;
  topP: number;
  batchSize: number;
  ubatchSize: number;
  device: string;
  systemPrompt: string;
}

export interface CodeArtifact {
  title: string;
  language: string;
  code: string;
  filePath?: string;
}

export interface PiAgentStepData {
  type: 'thought' | 'tool_call' | 'tool_result' | 'artifact' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  toolOutput?: any;
  artifact?: CodeArtifact;
}

export interface ProcessState {
  status: 'Stopped' | 'Starting' | 'Running' | string;
  pid: number | null;
  port: number;
  binary_path: string;
  model_path: string;
  is_embedding: boolean;
  logs: string[];
}
