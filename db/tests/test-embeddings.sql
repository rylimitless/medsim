-- Test script for embedding functionality using actual brain regions
-- Updated to use the new embeddings table structure

-- Insert sample structures using actual brain region names from pial_DKT_obj
INSERT INTO structures (id, mesh_name, display_name, description)
VALUES 
    (gen_random_uuid(), 'lh.pial.DKT.precentral', 'Left Precentral Gyrus', 'Primary motor cortex - controls voluntary movements'),
    (gen_random_uuid(), 'lh.pial.DKT.postcentral', 'Left Postcentral Gyrus', 'Primary somatosensory cortex - processes tactile sensations'),
    (gen_random_uuid(), 'lh.pial.DKT.inferiortemporal', 'Left Inferior Temporal Gyrus', 'Involved in visual processing and object recognition'),
    (gen_random_uuid(), 'rh.pial.DKT.precentral', 'Right Precentral Gyrus', 'Primary motor cortex - controls voluntary movements'),
    (gen_random_uuid(), 'rh.pial.DKT.postcentral', 'Right Postcentral Gyrus', 'Primary somatosensory cortex - processes tactile sensations')
ON CONFLICT (mesh_name) DO NOTHING;

-- Insert sample messages (without embeddings) for each structure
DO $$
DECLARE
    v_structure_id UUID;
    v_message_id UUID;
    v_counter INTEGER;
BEGIN
    -- Insert messages for left precentral gyrus
    SELECT id INTO v_structure_id FROM structures WHERE mesh_name = 'lh.pial.DKT.precentral';
    
    IF v_structure_id IS NOT NULL THEN
        FOR v_counter IN 1..3 LOOP
            -- Insert message
            INSERT INTO messages (id, structure_id, role, content)
            VALUES (
                gen_random_uuid(),
                v_structure_id,
                CASE WHEN v_counter % 2 = 1 THEN 'user'::message_role ELSE 'assistant'::message_role END,
                CASE 
                    WHEN v_counter = 1 THEN 'What functions are controlled by the precentral gyrus?'
                    WHEN v_counter = 2 THEN 'The precentral gyrus is the primary motor cortex that controls voluntary movements of the contralateral side of the body.'
                    ELSE 'Can you explain the somatotopic organization?'
                END
            )
            RETURNING id INTO v_message_id;
            
            -- Insert embedding for the message
            INSERT INTO embeddings (id, source_type, message_id, embedding)
            VALUES (
                gen_random_uuid(),
                'message'::embedding_source_type,
                v_message_id,
                -- Create a 4096-dimensional vector with pattern based on counter
                array_fill((v_counter * 0.1)::float8, ARRAY[4096])::vector
            );
        END LOOP;
    END IF;
    
    -- Insert messages for left postcentral gyrus
    SELECT id INTO v_structure_id FROM structures WHERE mesh_name = 'lh.pial.DKT.postcentral';
    
    IF v_structure_id IS NOT NULL THEN
        FOR v_counter IN 1..3 LOOP
            -- Insert message
            INSERT INTO messages (id, structure_id, role, content)
            VALUES (
                gen_random_uuid(),
                v_structure_id,
                CASE WHEN v_counter % 2 = 1 THEN 'user'::message_role ELSE 'assistant'::message_role END,
                CASE 
                    WHEN v_counter = 1 THEN 'What is the function of the postcentral gyrus?'
                    WHEN v_counter = 2 THEN 'The postcentral gyrus is the primary somatosensory cortex that processes tactile sensations from the contralateral side of the body.'
                    ELSE 'Does it have somatotopic organization too?'
                END
            )
            RETURNING id INTO v_message_id;
            
            -- Insert embedding for the message
            INSERT INTO embeddings (id, source_type, message_id, embedding)
            VALUES (
                gen_random_uuid(),
                'message'::embedding_source_type,
                v_message_id,
                array_fill((v_counter * 0.1 + 0.2)::float8, ARRAY[4096])::vector
            );
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Test data inserted successfully';
END $$;

-- Display inserted structures
SELECT id, mesh_name, display_name FROM structures ORDER BY mesh_name;

-- Display inserted messages with structure info
SELECT 
    m.id,
    s.mesh_name,
    m.role,
    m.content,
    m.created_at
FROM messages m
JOIN structures s ON m.structure_id = s.id
ORDER BY s.mesh_name, m.created_at;

-- Display message embeddings
SELECT 
    e.id as embedding_id,
    m.id as message_id,
    s.mesh_name,
    m.role,
    m.content,
    e.created_at
FROM embeddings e
JOIN messages m ON e.message_id = m.id
JOIN structures s ON m.structure_id = s.id
WHERE e.source_type = 'message'
ORDER BY s.mesh_name, m.created_at;

-- Test vector similarity search using cosine distance
-- Find messages similar to the first user message
SELECT 
    m.id,
    s.mesh_name,
    m.role,
    m.content,
    e.embedding <=> (
        SELECT e2.embedding 
        FROM embeddings e2
        JOIN messages m2 ON e2.message_id = m2.id
        WHERE m2.role = 'user'::message_role 
        ORDER BY m2.created_at 
        LIMIT 1
    ) as cosine_distance
FROM messages m
JOIN structures s ON m.structure_id = s.id
JOIN embeddings e ON e.message_id = m.id
ORDER BY cosine_distance;

-- Count messages by structure
SELECT 
    s.mesh_name,
    s.display_name,
    COUNT(m.id) as message_count
FROM structures s
LEFT JOIN messages m ON s.id = m.structure_id
GROUP BY s.id, s.mesh_name, s.display_name
ORDER BY s.mesh_name;

-- Test that embeddings exist and have correct dimensions
SELECT 
    'Message embedding test' as test_name,
    COUNT(*) as total_messages,
    COUNT(e.id) as messages_with_embeddings
FROM messages m
LEFT JOIN embeddings e ON e.message_id = m.id AND e.source_type = 'message';

-- Verify vector operations work
SELECT 
    'Cosine distance self-test' as test_name,
    CASE 
        WHEN (e.embedding <=> e.embedding) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM embeddings e
WHERE e.source_type = 'message'
LIMIT 1;

-- Test mesh name embeddings
-- Insert mesh name embeddings for test structures
INSERT INTO embeddings (id, source_type, structure_id, embedding)
SELECT 
    gen_random_uuid(),
    'mesh_name'::embedding_source_type,
    s.id,
    -- Create a deterministic vector based on mesh name
    array_fill((md5(s.mesh_name)::bigint % 1000)::float8 / 1000.0, ARRAY[4096])::vector
FROM structures s
WHERE s.mesh_name IN ('lh.pial.DKT.precentral', 'lh.pial.DKT.postcentral', 'lh.pial.DKT.inferiortemporal')
AND NOT EXISTS (
    SELECT 1 FROM embeddings e 
    WHERE e.source_type = 'mesh_name' AND e.structure_id = s.id
);

-- Display mesh name embeddings
SELECT 
    e.id as embedding_id,
    e.source_type,
    s.mesh_name,
    s.display_name,
    e.created_at
FROM embeddings e
JOIN structures s ON e.structure_id = s.id
WHERE e.source_type = 'mesh_name'
ORDER BY s.mesh_name;

-- Test cross-type similarity search
-- Find both messages and mesh names similar to a query vector
WITH query_vector AS (
    SELECT array_fill(0.1::float8, ARRAY[4096])::vector as vec
)
SELECT 
    e.source_type,
    e.id,
    COALESCE(m.content, s.mesh_name || ' - ' || s.display_name) as content,
    e.embedding <=> (SELECT vec FROM query_vector) as cosine_distance
FROM embeddings e
LEFT JOIN messages m ON e.message_id = m.id
LEFT JOIN structures s ON e.structure_id = s.id
ORDER BY cosine_distance
LIMIT 10;

-- Summary
SELECT 
    'Test Summary' as section,
    (SELECT COUNT(*) FROM structures) as structures_count,
    (SELECT COUNT(*) FROM messages) as messages_count,
    (SELECT COUNT(*) FROM embeddings WHERE source_type = 'message') as message_embeddings_count,
    (SELECT COUNT(*) FROM embeddings WHERE source_type = 'mesh_name') as mesh_name_embeddings_count;
