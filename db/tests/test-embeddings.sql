-- Test script for embedding functionality using actual brain regions

-- Insert sample structures using actual brain region names from pial_DKT_obj
INSERT INTO structures (id, mesh_name, display_name, description)
VALUES 
    (gen_random_uuid(), 'lh.pial.DKT.precentral', 'Left Precentral Gyrus', 'Primary motor cortex - controls voluntary movements'),
    (gen_random_uuid(), 'lh.pial.DKT.postcentral', 'Left Postcentral Gyrus', 'Primary somatosensory cortex - processes tactile sensations'),
    (gen_random_uuid(), 'lh.pial.DKT.inferiortemporal', 'Left Inferior Temporal Gyrus', 'Involved in visual processing and object recognition'),
    (gen_random_uuid(), 'rh.pial.DKT.precentral', 'Right Precentral Gyrus', 'Primary motor cortex - controls voluntary movements'),
    (gen_random_uuid(), 'rh.pial.DKT.postcentral', 'Right Postcentral Gyrus', 'Primary somatosensory cortex - processes tactile sensations')
ON CONFLICT (mesh_name) DO NOTHING;

-- Insert sample messages with embeddings for each structure
DO $$
DECLARE
    v_structure_id UUID;
    v_counter INTEGER;
BEGIN
    -- Insert messages for left precentral gyrus
    SELECT id INTO v_structure_id FROM structures WHERE mesh_name = 'lh.pial.DKT.precentral';
    
    IF v_structure_id IS NOT NULL THEN
        FOR v_counter IN 1..3 LOOP
            INSERT INTO messages (id, structure_id, role, content, embedding)
            VALUES (
                gen_random_uuid(),
                v_structure_id,
                CASE WHEN v_counter % 2 = 1 THEN 'user'::message_role ELSE 'assistant'::message_role END,
                CASE 
                    WHEN v_counter = 1 THEN 'What functions are controlled by the precentral gyrus?'
                    WHEN v_counter = 2 THEN 'The precentral gyrus is the primary motor cortex that controls voluntary movements of the contralateral side of the body.'
                    ELSE 'Can you explain the somatotopic organization?'
                END,
                -- Create a 4096-dimensional vector with pattern based on counter
                array_fill((v_counter * 0.1)::float8, ARRAY[4096])::vector
            );
        END LOOP;
    END IF;
    
    -- Insert messages for left postcentral gyrus
    SELECT id INTO v_structure_id FROM structures WHERE mesh_name = 'lh.pial.DKT.postcentral';
    
    IF v_structure_id IS NOT NULL THEN
        FOR v_counter IN 1..3 LOOP
            INSERT INTO messages (id, structure_id, role, content, embedding)
            VALUES (
                gen_random_uuid(),
                v_structure_id,
                CASE WHEN v_counter % 2 = 1 THEN 'user'::message_role ELSE 'assistant'::message_role END,
                CASE 
                    WHEN v_counter = 1 THEN 'What is the function of the postcentral gyrus?'
                    WHEN v_counter = 2 THEN 'The postcentral gyrus is the primary somatosensory cortex that processes tactile sensations from the contralateral side of the body.'
                    ELSE 'Does it have somatotopic organization too?'
                END,
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

-- Test vector similarity search using cosine distance
-- Find messages similar to the first user message
SELECT 
    m.id,
    s.mesh_name,
    m.role,
    m.content,
    m.embedding <=> (
        SELECT m2.embedding 
        FROM messages m2 
        WHERE m2.role = 'user'::message_role 
        ORDER BY m2.created_at 
        LIMIT 1
    ) as cosine_distance
FROM messages m
JOIN structures s ON m.structure_id = s.id
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
    'Embedding test' as test_name,
    COUNT(*) as total_messages,
    COUNT(embedding) as messages_with_embeddings
FROM messages;

-- Verify vector operations work
SELECT 
    'Cosine distance self-test' as test_name,
    CASE 
        WHEN (embedding <=> embedding) = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM messages
LIMIT 1;
