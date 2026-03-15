import { EmbeddingService, MeshMatch } from './embedding-service';
import { queryDatabase } from '@/lib/db';

interface MeshQueryResult {
  mesh_id: string;
  mesh_name: string;
  display_name: string;
  similarity: number;
}

interface StructureResult {
  id: string;
  mesh_name: string;
  display_name: string;
}

export class MeshMatcher {
  private embeddingService: EmbeddingService;
  private similarityThreshold = 0.7;

  constructor(apiKey: string = '') {
    this.embeddingService = new EmbeddingService(apiKey);
  }

  async findBestMatch(query: string): Promise<MeshMatch | null> {
    try {
      console.log('[MeshMatcher] Finding match for query:', query);

      // Generate embedding for user query
      const queryEmbedding = await this.embeddingService.generateEmbedding({
        text: query,
        sourceType: 'mesh_name',
        structureId: '', // This is a user query, not a specific structure
      });

      // Query database for similar mesh names using cosine similarity
      const match = await this.queryDatabase(queryEmbedding);

      if (match) {
        console.log('[MeshMatcher] Found match:', match);
        return match;
      }

      console.log('[MeshMatcher] No match found');
      return null;

    } catch (error) {
      console.error('[MeshMatcher] Error finding match:', error);
      return null;
    }
  }

  private async queryDatabase(queryEmbedding: number[]): Promise<MeshMatch | null> {

    try {
      const result = await queryDatabase<MeshQueryResult>(
        `SELECT
          s.id as mesh_id,
          s.mesh_name,
          s.display_name,
          e.embedding <=> $1 as similarity
        FROM structures s
        JOIN embeddings e ON e.structure_id = s.id
        WHERE e.source_type = 'mesh_name'
        ORDER BY similarity ASC
        LIMIT 5
      `,
        [queryEmbedding]
      );

      if (result.length === 0) {
        return null;
      }

      // Return best match if similarity > threshold
      const bestMatch = result[0];
      if (bestMatch.similarity >= this.similarityThreshold) {
        return {
          meshId: bestMatch.mesh_id,
          meshName: bestMatch.mesh_name,
          displayName: bestMatch.display_name,
          similarity: bestMatch.similarity,
        };
      }

      return null;
    } catch (error) {
      console.error('[MeshMatcher] Error querying database:', error);
      return null;
    }
  }

  async precomputeMeshEmbeddings(): Promise<void> {
    console.log('[MeshMatcher] Precomputing mesh name embeddings...');

    try {
      // Get all structures
      const structures = await queryDatabase<StructureResult>(
        'SELECT id, mesh_name, display_name FROM structures ORDER BY mesh_name'
      );

      console.log('[MeshMatcher] Found', structures.length, 'structures to embed');

      // Generate embeddings for each structure
      for (const structure of structures) {
        await this.embeddingService.generateEmbedding({
          text: `${structure.mesh_name} ${structure.display_name}`,
          sourceType: 'mesh_name',
          structureId: structure.id,
        });
      }

      console.log('[MeshMatcher] Precomputation complete');
    } catch (error) {
      console.error('[MeshMatcher] Error precomputing embeddings:', error);
    }
  }
}
