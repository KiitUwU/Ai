use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextChunk {
    pub chunk_index: usize,
    pub text: String,
    pub char_count: usize,
    pub token_estimate: usize,
}

pub struct DocumentChunker {
    pub chunk_size_chars: usize,
    pub chunk_overlap_chars: usize,
}

impl DocumentChunker {
    pub fn new(chunk_size_tokens: usize, overlap_tokens: usize) -> Self {
        // Approximate 1 token = 4 characters
        Self {
            chunk_size_chars: chunk_size_tokens * 4,
            chunk_overlap_chars: overlap_tokens * 4,
        }
    }

    pub fn chunk_text(&self, text: &str) -> Vec<TextChunk> {
        let mut chunks = Vec::new();
        if text.trim().is_empty() {
            return chunks;
        }

        // Split by logical paragraphs first
        let paragraphs: Vec<&str> = text.split("\n\n").collect();
        let mut current_chunk = String::new();
        let mut chunk_idx = 0;

        for para in paragraphs {
            let trimmed = para.trim();
            if trimmed.is_empty() {
                continue;
            }

            if current_chunk.len() + trimmed.len() > self.chunk_size_chars && !current_chunk.is_empty() {
                let char_count = current_chunk.len();
                let token_estimate = char_count / 4;
                chunks.push(TextChunk {
                    chunk_index: chunk_idx,
                    text: current_chunk.clone(),
                    char_count,
                    token_estimate,
                });
                chunk_idx += 1;

                // Carry over overlap from the end of current_chunk
                if current_chunk.len() > self.chunk_overlap_chars {
                    let overlap_start = current_chunk.len() - self.chunk_overlap_chars;
                    current_chunk = current_chunk[overlap_start..].to_string();
                } else {
                    current_chunk.clear();
                }
            }

            if !current_chunk.is_empty() {
                current_chunk.push_str("\n\n");
            }
            current_chunk.push_str(trimmed);
        }

        if !current_chunk.trim().is_empty() {
            let char_count = current_chunk.len();
            let token_estimate = char_count / 4;
            chunks.push(TextChunk {
                chunk_index: chunk_idx,
                text: current_chunk,
                char_count,
                token_estimate,
            });
        }

        chunks
    }
}
