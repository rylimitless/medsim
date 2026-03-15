-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ENUM type for message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Create ENUM type for embedding source types
CREATE TYPE embedding_source_type AS ENUM ('message', 'mesh_name');

-- Create structures table
CREATE TABLE structures (
    id UUID PRIMARY KEY,
    mesh_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create messages table (without embedding column)
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    structure_id UUID REFERENCES structures(id),
    role message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Create embeddings table
CREATE TABLE embeddings (
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

-- Create indexes for better query performance
CREATE INDEX idx_messages_structure_id ON messages(structure_id);
CREATE INDEX idx_messages_role ON messages(role);

-- Indexes for embeddings table
CREATE INDEX idx_embeddings_message_id ON embeddings(message_id) WHERE source_type = 'message';
CREATE INDEX idx_embeddings_structure_id ON embeddings(structure_id) WHERE source_type = 'mesh_name';
CREATE INDEX idx_embeddings_source_type ON embeddings(source_type);
-- Note: Sequential scan is used for vector similarity search (no vector index)
-- This provides best accuracy with full-precision vectors for small datasets
-- To enable HNSW index for larger datasets, consider using halfvec type

-- Seed structures table with brain models
INSERT INTO structures (id, mesh_name, display_name, description) VALUES
-- Left Hemisphere
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.caudalanteriorcingulate.obj', 'Left Hemisphere - Caudal Anterior Cingulate', 'Anterior part of the cingulate gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.caudalmiddlefrontal.obj', 'Left Hemisphere - Caudal Middle Frontal', 'Caudal portion of the middle frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.cuneus.obj', 'Left Hemisphere - Cuneus', 'Cuneus region in the left hemisphere, part of the occipital lobe'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.entorhinal.obj', 'Left Hemisphere - Entorhinal', 'Entorhinal cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.fusiform.obj', 'Left Hemisphere - Fusiform', 'Fusiform gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.inferiorparietal.obj', 'Left Hemisphere - Inferior Parietal', 'Inferior parietal lobule in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.inferiortemporal.obj', 'Left Hemisphere - Inferior Temporal', 'Inferior temporal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.insula.obj', 'Left Hemisphere - Insula', 'Insular cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.isthmuscingulate.obj', 'Left Hemisphere - Isthmus Cingulate', 'Isthmus of the cingulate gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.lateraloccipital.obj', 'Left Hemisphere - Lateral Occipital', 'Lateral occipital cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.lateralorbitofrontal.obj', 'Left Hemisphere - Lateral Orbitofrontal', 'Lateral orbitofrontal cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.lingual.obj', 'Left Hemisphere - Lingual', 'Lingual gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.medialorbitofrontal.obj', 'Left Hemisphere - Medial Orbitofrontal', 'Medial orbitofrontal cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.middletemporal.obj', 'Left Hemisphere - Middle Temporal', 'Middle temporal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.paracentral.obj', 'Left Hemisphere - Paracentral', 'Paracentral lobule in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.parahippocampal.obj', 'Left Hemisphere - Parahippocampal', 'Parahippocampal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.parsopercularis.obj', 'Left Hemisphere - Pars Opercularis', 'Pars opercularis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.parsorbitalis.obj', 'Left Hemisphere - Pars Orbitalis', 'Pars orbitalis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.parstriangularis.obj', 'Left Hemisphere - Pars Triangularis', 'Pars triangularis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.pericalcarine.obj', 'Left Hemisphere - Pericalcarine', 'Pericalcarine cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.postcentral.obj', 'Left Hemisphere - Postcentral', 'Postcentral gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.posteriorcingulate.obj', 'Left Hemisphere - Posterior Cingulate', 'Posterior cingulate cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.precentral.obj', 'Left Hemisphere - Precentral', 'Precentral gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.precuneus.obj', 'Left Hemisphere - Precuneus', 'Precuneus region in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.rostralanteriorcingulate.obj', 'Left Hemisphere - Rostral Anterior Cingulate', 'Rostral anterior cingulate cortex in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.rostralmiddlefrontal.obj', 'Left Hemisphere - Rostral Middle Frontal', 'Rostral middle frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.superiorfrontal.obj', 'Left Hemisphere - Superior Frontal', 'Superior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.superiorparietal.obj', 'Left Hemisphere - Superior Parietal', 'Superior parietal lobule in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.superiortemporal.obj', 'Left Hemisphere - Superior Temporal', 'Superior temporal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.supramarginal.obj', 'Left Hemisphere - Supramarginal', 'Supramarginal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.transversetemporal.obj', 'Left Hemisphere - Transverse Temporal', 'Transverse temporal gyrus in the left hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/lh.pial.DKT.unknown.obj', 'Left Hemisphere - Unknown', 'Unlabeled region in the left hemisphere'),
-- Right Hemisphere
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.caudalanteriorcingulate.obj', 'Right Hemisphere - Caudal Anterior Cingulate', 'Anterior part of the cingulate gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.caudalmiddlefrontal.obj', 'Right Hemisphere - Caudal Middle Frontal', 'Caudal portion of the middle frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.cuneus.obj', 'Right Hemisphere - Cuneus', 'Cuneus region in the right hemisphere, part of the occipital lobe'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.entorhinal.obj', 'Right Hemisphere - Entorhinal', 'Entorhinal cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.fusiform.obj', 'Right Hemisphere - Fusiform', 'Fusiform gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.inferiorparietal.obj', 'Right Hemisphere - Inferior Parietal', 'Inferior parietal lobule in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.inferiortemporal.obj', 'Right Hemisphere - Inferior Temporal', 'Inferior temporal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.insula.obj', 'Right Hemisphere - Insula', 'Insular cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.isthmuscingulate.obj', 'Right Hemisphere - Isthmus Cingulate', 'Isthmus of the cingulate gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.lateraloccipital.obj', 'Right Hemisphere - Lateral Occipital', 'Lateral occipital cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.lateralorbitofrontal.obj', 'Right Hemisphere - Lateral Orbitofrontal', 'Lateral orbitofrontal cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.lingual.obj', 'Right Hemisphere - Lingual', 'Lingual gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.medialorbitofrontal.obj', 'Right Hemisphere - Medial Orbitofrontal', 'Medial orbitofrontal cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.middletemporal.obj', 'Right Hemisphere - Middle Temporal', 'Middle temporal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.paracentral.obj', 'Right Hemisphere - Paracentral', 'Paracentral lobule in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.parahippocampal.obj', 'Right Hemisphere - Parahippocampal', 'Parahippocampal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.parsopercularis.obj', 'Right Hemisphere - Pars Opercularis', 'Pars opercularis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.parsorbitalis.obj', 'Right Hemisphere - Pars Orbitalis', 'Pars orbitalis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.parstriangularis.obj', 'Right Hemisphere - Pars Triangularis', 'Pars triangularis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.pericalcarine.obj', 'Right Hemisphere - Pericalcarine', 'Pericalcarine cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.postcentral.obj', 'Right Hemisphere - Postcentral', 'Postcentral gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.posteriorcingulate.obj', 'Right Hemisphere - Posterior Cingulate', 'Posterior cingulate cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.precentral.obj', 'Right Hemisphere - Precentral', 'Precentral gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.precuneus.obj', 'Right Hemisphere - Precuneus', 'Precuneus region in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.rostralanteriorcingulate.obj', 'Right Hemisphere - Rostral Anterior Cingulate', 'Rostral anterior cingulate cortex in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.rostralmiddlefrontal.obj', 'Right Hemisphere - Rostral Middle Frontal', 'Rostral middle frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.superiorfrontal.obj', 'Right Hemisphere - Superior Frontal', 'Superior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.superiorparietal.obj', 'Right Hemisphere - Superior Parietal', 'Superior parietal lobule in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.superiortemporal.obj', 'Right Hemisphere - Superior Temporal', 'Superior temporal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.supramarginal.obj', 'Right Hemisphere - Supramarginal', 'Supramarginal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.transversetemporal.obj', 'Right Hemisphere - Transverse Temporal', 'Transverse temporal gyrus in the right hemisphere'),
(gen_random_uuid(), '/pial_DKT_obj/rh.pial.DKT.unknown.obj', 'Right Hemisphere - Unknown', 'Unlabeled region in the right hemisphere');
