pub mod chunker;
pub mod embeddings;
pub mod vector_store;

pub use chunker::DocumentChunker;
pub use embeddings::EmbeddingClient;
pub use vector_store::{RagSearchResult, VectorStore};

pub struct RagEngine {
    pub vector_store: VectorStore,
    pub chunker: DocumentChunker,
    pub embedding_client: EmbeddingClient,
}

impl RagEngine {
    pub fn new(embedding_endpoint: &str, use_xdna2: bool) -> Result<Self, String> {
        let vector_store = VectorStore::new_in_memory()?;
        let chunker = DocumentChunker::new(512, 64);
        let embedding_client = EmbeddingClient::new(embedding_endpoint, use_xdna2);

        Ok(Self {
            vector_store,
            chunker,
            embedding_client,
        })
    }

    pub async fn ingest_text(
        &self,
        filename: &str,
        path: &str,
        collection: &str,
        content: &str,
    ) -> Result<i64, String> {
        let chunks = self.chunker.chunk_text(content);
        if chunks.is_empty() {
            return Err("Document produced no readable chunks".into());
        }

        let texts: Vec<String> = chunks.iter().map(|c| c.text.clone()).collect();
        let embeddings = self.embedding_client.embed_batch(&texts).await?;

        self.vector_store
            .insert_document(filename, path, collection, &chunks, &embeddings)
    }

    pub async fn search_relevant(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<Vec<RagSearchResult>, String> {
        let query_embeddings = self
            .embedding_client
            .embed_batch(&[query.to_string()])
            .await?;

        let query_vec = query_embeddings
            .first()
            .ok_or("Failed to generate query embedding")?;

        self.vector_store.search(query_vec, top_k, 0.1)
    }
}
