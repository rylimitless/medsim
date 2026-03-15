-- Script to embed and store mesh names from structures table
-- This script creates embeddings for mesh names and stores them in the embeddings table

-- Insert embeddings for all mesh names from structures table
-- Combines mesh_name, display_name, and description for better semantic search
INSERT INTO embeddings (id, source_type, structure_id, embedding, created_at)
SELECT
    gen_random_uuid(),
    'mesh_name'::embedding_source_type,
    s.id as structure_id,
    -- TODO: Replace this with actual embedding generation
    -- For now, create a deterministic vector based on the structure id
    -- Use a hash function that returns a numeric value
    array_fill((hashtext(s.id::text) % 1000)::float8 / 1000.0, ARRAY[4096])::vector,
    now()
FROM structures s
WHERE NOT EXISTS (
    -- Only insert if there's no existing embedding for this structure
    SELECT 1 FROM embeddings e 
    WHERE e.source_type = 'mesh_name' AND e.structure_id = s.id
);

-- Verify the embeddings were created
SELECT 
    'Mesh name embeddings created successfully' as status,
    (SELECT COUNT(*) FROM embeddings WHERE source_type = 'mesh_name') as mesh_name_embeddings_count,
    (SELECT COUNT(*) FROM structures) as total_structures;

-- Display sample embeddings with structure info
SELECT 
    e.id,
    e.source_type,
    s.mesh_name,
    s.display_name,
    e.created_at
FROM embeddings e
JOIN structures s ON e.structure_id = s.id
WHERE e.source_type = 'mesh_name'
ORDER BY s.mesh_name
LIMIT 10;
