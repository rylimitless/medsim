import { getPool } from '@/lib/db';

export interface EmbeddingRequest {
  text: string;
  sourceType: 'mesh_name';
  structureId: string;
}

export interface MeshMatch {
  meshId: string;
  meshName: string;
  displayName: string;
  similarity: number;
}

export class EmbeddingService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('EmbeddingService not initialized. Provide API key.');
    }

    try {
      console.log('[EmbeddingService] Generating embedding for:', request.text);

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
          'X-Title': 'MedSim Voice Control',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-embedding-8b',
          input: request.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const embedding = result.data?.[0]?.embedding || [];
      
      console.log('[EmbeddingService] Generated embedding (length:', embedding.length, ')');

      // Store in database
      await this.storeEmbedding(request, embedding);

      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error);
      throw error;
    }
  }

  private async storeEmbedding(request: EmbeddingRequest, embedding: number[]): Promise<void> {
    const db = getPool();

    // Format embedding as PostgreSQL vector string
    const vectorString = `[${embedding.join(',')}]`;

    // Check if embedding already exists
    const existingCheck = await db.query(
      'SELECT id FROM embeddings WHERE source_type = $1 AND structure_id = $2',
      [request.sourceType, request.structureId]
    );

    if (existingCheck.rows.length > 0) {
      console.log('[EmbeddingService] Embedding already exists, updating');
      await db.query(
        'UPDATE embeddings SET embedding = $1::vector, created_at = NOW() WHERE source_type = $2 AND structure_id = $3',
        [vectorString, request.sourceType, request.structureId]
      );
    } else {
      console.log('[EmbeddingService] Creating new embedding');
      await db.query(
        `INSERT INTO embeddings (id, source_type, structure_id, embedding, created_at)
        VALUES ($1, $2, $3, $4::vector, NOW())`,
        [crypto.randomUUID(), request.sourceType, request.structureId, vectorString]
      );
    }
  }

  async getEmbeddingForMesh(meshId: string): Promise<number[] | null> {
    const db = getPool();

    try {
      const result = await db.query(
        'SELECT embedding FROM embeddings WHERE source_type = $1 AND structure_id = $2 ORDER BY created_at DESC LIMIT 1',
        ['mesh_name', meshId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const embedding = result.rows[0].embedding;
      console.log('[EmbeddingService] Retrieved embedding for mesh:', meshId);
      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error retrieving embedding:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.apiKey !== '';
  }
}
