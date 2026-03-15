#!/usr/bin/env -S tsx

/**
 * Embed Meshes Script
 * 
 * Generates and stores embeddings for all mesh structures
 * in the database using OpenRouter API.
 * 
 * Usage: npm run embed-meshes
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Structure {
  id: string;
  mesh_name: string;
  display_name: string;
  description: string | null;
}

// Build DATABASE_URL from individual environment variables if not provided
const databaseUrl = process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`;

// Validate environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Missing required environment variable: OPENROUTER_API_KEY');
  process.exit(1);
}

// Create database connection
const db = new Pool({
  connectionString: databaseUrl,
  max: 10,
});

console.log('🚀 Starting Mesh Embedding Script');
console.log('='.repeat(50));

// Fetch all structures
async function fetchStructures(): Promise<Structure[]> {
  const result = await db.query<Structure>(
    'SELECT id, mesh_name, display_name, description FROM structures ORDER BY display_name'
  );
  return result.rows;
}

// Generate embedding using OpenRouter API
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  const model = process.env.OPENROUTER_EMBEDDING_MODEL || 'qwen/qwen3-embedding-8b';

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://medsim.local',
      'X-Title': 'MedSim Mesh Embedding',
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const embedding = result.data?.[0]?.embedding || [];
  
  if (embedding.length === 0) {
    throw new Error('Empty embedding returned from API');
  }
  
  return embedding;
}

// Store embedding in database
async function storeEmbedding(structureId: string, embedding: number[]): Promise<void> {
  const vectorString = `[${embedding.join(',')}]`;

  // Check if embedding already exists
  const existingCheck = await db.query(
    'SELECT id FROM embeddings WHERE source_type = $1 AND structure_id = $2',
    ['mesh_name', structureId]
  );

  if (existingCheck.rows.length > 0) {
    // Update existing embedding
    await db.query(
      'UPDATE embeddings SET embedding = $1::vector, created_at = NOW() WHERE source_type = $2 AND structure_id = $3',
      [vectorString, 'mesh_name', structureId]
    );
  } else {
    // Insert new embedding
    await db.query(
      `INSERT INTO embeddings (id, source_type, structure_id, embedding, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())`,
      ['mesh_name', structureId, vectorString]
    );
  }
}

// Generate text for embedding from structure data
function generateEmbeddingText(structure: Structure): string {
  const parts: string[] = [];
  parts.push(structure.display_name);
  parts.push(structure.mesh_name);
  if (structure.description) {
    parts.push(structure.description);
  }
  return parts.join('. ');
}

// Main execution
async function main(): Promise<void> {
  try {
    const structures = await fetchStructures();
    console.log(`✅ Found ${structures.length} structures\n`);

    let successful = 0;
    let failed = 0;

    for (let i = 0; i < structures.length; i++) {
      const structure = structures[i];
      console.log(`[${i + 1}/${structures.length}] ${structure.display_name}`);

      try {
        const text = generateEmbeddingText(structure);
        const embedding = await generateEmbedding(text);
        await storeEmbedding(structure.id, embedding);
        console.log(`  ✓ Embedding generated and stored (${embedding.length} dimensions)\n`);
        successful++;
      } catch (error) {
        console.error(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`);
        failed++;
      }

      // Delay to avoid rate limits
      if (i < structures.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${structures.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n✅ All embeddings generated successfully!');
    } else {
      console.log('\n⚠️  Some embeddings failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await db.end();
    console.log('\n✅ Database connection closed');
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
