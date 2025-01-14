
export interface EmbeddingChunk {
    source_id: string,
    source_type: string,
    title: string;
    description: string;
    vector_embedding?: number[];
    created_at?: Date;
}


export interface EmbeddingStatus {
    source_id: string;
    embeddings_generated: number;
    embeddings_missing: number;
    total_chunks: number;
    source_type: string;
}