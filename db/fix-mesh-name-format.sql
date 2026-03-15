-- Migration: Fix mesh name format in structures table
-- Description: Remove leading slash from mesh names
-- Before: /lh.pial.DKT.caudalanteriorcingulate
-- After: lh.pial.DKT.caudalanteriorcingulate

-- First, let's verify current state
SELECT 'Before update:' as status, COUNT(*) as count FROM structures WHERE mesh_name LIKE '/lh.pial.DKT.%' OR mesh_name LIKE '/rh.pial.DKT.%';

-- Update all mesh names to remove leading slash
UPDATE structures
SET mesh_name = substring(mesh_name from 2)
WHERE mesh_name LIKE '/lh.pial.DKT.%' OR mesh_name LIKE '/rh.pial.DKT.%';

-- Verify the changes
SELECT 'After update:' as status, COUNT(*) as count FROM structures WHERE mesh_name LIKE 'lh.pial.DKT.%' OR mesh_name LIKE 'rh.pial.DKT.%';

-- Show sample of updated records
SELECT id, mesh_name, display_name 
FROM structures 
ORDER BY mesh_name 
LIMIT 10;
