-- Migration script: Move embeddings from messages table to new embeddings table
-- This script handles the transition from the old schema to the new one

-- Step 1: Create new ENUM type for embedding source types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'embedding_source_type') THEN
        CREATE TYPE embedding_source_type AS ENUM ('message', 'mesh_name');
    END IF;
END $$;

-- Step 2: Create the new embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY,
    source_type embedding_source_type NOT NULL,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
    embedding VECTOR(4096) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    
    -- Ensure either message_id or structure_id is set based on source_type
    CONSTRAINT valid_source_reference CHECK (
        (source_type = 'message' AND message_id IS NOT NULL AND structure_id IS NULL) OR
        (source_type = 'mesh_name' AND message_id IS NULL AND structure_id IS NOT NULL)
    )
);

-- Step 3: Create indexes for embeddings table
CREATE INDEX IF NOT EXISTS idx_embeddings_message_id ON embeddings(message_id) WHERE source_type = 'message';
CREATE INDEX IF NOT EXISTS idx_embeddings_structure_id ON embeddings(structure_id) WHERE source_type = 'mesh_name';
CREATE INDEX IF NOT EXISTS idx_embeddings_source_type ON embeddings(source_type);
-- Note: Sequential scan is used for vector similarity search (no vector index)
-- This provides best accuracy with full-precision vectors for small datasets
-- To enable HNSW index for larger datasets, consider using halfvec type

-- Step 4: Migrate existing message embeddings to the new embeddings table
INSERT INTO embeddings (id, source_type, message_id, embedding, created_at)
SELECT 
    gen_random_uuid(),
    'message'::embedding_source_type,
    id as message_id,
    embedding,
    created_at
FROM messages
WHERE embedding IS NOT NULL;

-- Step 5: Drop the old embedding column from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS embedding;

-- Step 6: Drop the old embedding index if it exists
DROP INDEX IF EXISTS idx_messages_embedding;

-- Step 7: Verify the migration
SELECT 
    'Migration completed successfully' as status,
    (SELECT COUNT(*) FROM embeddings WHERE source_type = 'message') as message_embeddings_migrated,
    (SELECT COUNT(*) FROM messages) as total_messages;
