use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagSearchResult {
    pub chunk_id: i64,
    pub document_name: String,
    pub file_path: String,
    pub chunk_index: usize,
    pub text: String,
    pub score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestedDocumentInfo {
    pub id: i64,
    pub filename: String,
    pub file_path: String,
    pub chunk_count: usize,
    pub created_at: String,
}

pub struct VectorStore {
    conn: Arc<Mutex<Connection>>,
}

impl VectorStore {
    pub fn new_in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.init_tables()?;
        Ok(store)
    }

    pub fn new_on_disk<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.init_tables()?;
        Ok(store)
    }

    fn init_tables(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                collection_name TEXT NOT NULL,
                chunk_count INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                text TEXT NOT NULL,
                embedding_blob BLOB NOT NULL,
                FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
            );",
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn insert_document(
        &self,
        filename: &str,
        file_path: &str,
        collection: &str,
        chunks: &[super::chunker::TextChunk],
        embeddings: &[Vec<f32>],
    ) -> Result<i64, String> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        let now = chrono::Utc::now().to_rfc3339();

        tx.execute(
            "INSERT INTO documents (filename, file_path, collection_name, chunk_count, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![filename, file_path, collection, chunks.len(), now],
        )
        .map_err(|e| e.to_string())?;

        let doc_id = tx.last_insert_rowid();

        for (i, chunk) in chunks.iter().enumerate() {
            let embedding = embeddings.get(i).ok_or("Embedding count mismatch")?;
            let blob: Vec<u8> = embedding
                .iter()
                .flat_map(|f| f.to_le_bytes().to_vec())
                .collect();

            tx.execute(
                "INSERT INTO chunks (document_id, chunk_index, text, embedding_blob)
                 VALUES (?1, ?2, ?3, ?4)",
                params![doc_id, chunk.chunk_index, chunk.text, blob],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(doc_id)
    }

    pub fn list_documents(&self) -> Result<Vec<IngestedDocumentInfo>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, filename, file_path, chunk_count, created_at FROM documents ORDER BY id DESC")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(IngestedDocumentInfo {
                    id: row.get(0)?,
                    filename: row.get(1)?,
                    file_path: row.get(2)?,
                    chunk_count: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut docs = Vec::new();
        for r in rows {
            if let Ok(doc) = r {
                docs.push(doc);
            }
        }
        Ok(docs)
    }

    pub fn search(
        &self,
        query_vector: &[f32],
        top_k: usize,
        min_score: f32,
    ) -> Result<Vec<RagSearchResult>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare(
                "SELECT c.id, d.filename, d.file_path, c.chunk_index, c.text, c.embedding_blob
                 FROM chunks c
                 JOIN documents d ON d.id = c.document_id",
            )
            .map_err(|e| e.to_string())?;

        let mut results = Vec::new();

        let rows = stmt
            .query_map([], |row| {
                let id: i64 = row.get(0)?;
                let filename: String = row.get(1)?;
                let file_path: String = row.get(2)?;
                let chunk_index: usize = row.get(3)?;
                let text: String = row.get(4)?;
                let blob: Vec<u8> = row.get(5)?;
                Ok((id, filename, file_path, chunk_index, text, blob))
            })
            .map_err(|e| e.to_string())?;

        for r in rows {
            if let Ok((id, filename, file_path, chunk_index, text, blob)) = r {
                let vector = Self::bytes_to_vector(&blob);
                let score = Self::cosine_similarity(query_vector, &vector);

                if score >= min_score {
                    results.push(RagSearchResult {
                        chunk_id: id,
                        document_name: filename,
                        file_path,
                        chunk_index,
                        text,
                        score,
                    });
                }
            }
        }

        // Sort descending by score
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(top_k);

        Ok(results)
    }

    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() || a.is_empty() {
            return 0.0;
        }

        let mut dot = 0.0f32;
        let mut norm_a = 0.0f32;
        let mut norm_b = 0.0f32;

        for (x, y) in a.iter().zip(b.iter()) {
            dot += x * y;
            norm_a += x * x;
            norm_b += y * y;
        }

        let denom = norm_a.sqrt() * norm_b.sqrt();
        if denom == 0.0 {
            0.0
        } else {
            dot / denom
        }
    }

    fn bytes_to_vector(blob: &[u8]) -> Vec<f32> {
        blob.chunks_exact(4)
            .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rag::chunker::TextChunk;

    #[test]
    fn test_cosine_similarity() {
        let v1 = vec![1.0, 0.0, 0.0];
        let v2 = vec![1.0, 0.0, 0.0];
        let sim = VectorStore::cosine_similarity(&v1, &v2);
        assert!((sim - 1.0).abs() < 1e-5);

        let v3 = vec![0.0, 1.0, 0.0];
        let sim_orthogonal = VectorStore::cosine_similarity(&v1, &v3);
        assert!((sim_orthogonal - 0.0).abs() < 1e-5);
    }

    #[test]
    fn test_in_memory_vector_store() {
        let store = VectorStore::new_in_memory().unwrap();
        let chunks = vec![
            TextChunk {
                chunk_index: 0,
                text: "AMD XDNA 2 architecture details".into(),
                char_count: 32,
                token_estimate: 8,
            },
            TextChunk {
                chunk_index: 1,
                text: "llama.cpp compilation flags".into(),
                char_count: 27,
                token_estimate: 7,
            },
        ];

        let embeddings = vec![
            vec![0.8, 0.2, 0.1],
            vec![0.1, 0.1, 0.9],
        ];

        let doc_id = store
            .insert_document("test.md", "/docs/test.md", "General", &chunks, &embeddings)
            .unwrap();
        assert!(doc_id > 0);

        let docs = store.list_documents().unwrap();
        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].filename, "test.md");

        // Query closer to chunk 0
        let query_vec = vec![0.9, 0.1, 0.0];
        let search_results = store.search(&query_vec, 2, 0.0).unwrap();
        assert_eq!(search_results.len(), 2);
        assert_eq!(search_results[0].text, "AMD XDNA 2 architecture details");
    }
}
