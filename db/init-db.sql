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
(gen_random_uuid(), 'lh.pial.DKT.caudalanteriorcingulate', 'Left Hemisphere - Caudal Anterior Cingulate', 'Anterior part of the cingulate gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.caudalmiddlefrontal', 'Left Hemisphere - Caudal Middle Frontal', 'Caudal portion of the middle frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.cuneus', 'Left Hemisphere - Cuneus', 'Cuneus region in the left hemisphere, part of the occipital lobe'),
(gen_random_uuid(), 'lh.pial.DKT.entorhinal', 'Left Hemisphere - Entorhinal', 'Entorhinal cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.fusiform', 'Left Hemisphere - Fusiform', 'Fusiform gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.inferiorparietal', 'Left Hemisphere - Inferior Parietal', 'Inferior parietal lobule in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.inferiortemporal', 'Left Hemisphere - Inferior Temporal', 'Inferior temporal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.insula', 'Left Hemisphere - Insula', 'Insular cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.isthmuscingulate', 'Left Hemisphere - Isthmus Cingulate', 'Isthmus of the cingulate gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.lateraloccipital', 'Left Hemisphere - Lateral Occipital', 'Lateral occipital cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.lateralorbitofrontal', 'Left Hemisphere - Lateral Orbitofrontal', 'Lateral orbitofrontal cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.lingual', 'Left Hemisphere - Lingual', 'Lingual gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.medialorbitofrontal', 'Left Hemisphere - Medial Orbitofrontal', 'Medial orbitofrontal cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.middletemporal', 'Left Hemisphere - Middle Temporal', 'Middle temporal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.paracentral', 'Left Hemisphere - Paracentral', 'Paracentral lobule in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.parahippocampal', 'Left Hemisphere - Parahippocampal', 'Parahippocampal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.parsopercularis', 'Left Hemisphere - Pars Opercularis', 'Pars opercularis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.parsorbitalis', 'Left Hemisphere - Pars Orbitalis', 'Pars orbitalis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.parstriangularis', 'Left Hemisphere - Pars Triangularis', 'Pars triangularis of the inferior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.pericalcarine', 'Left Hemisphere - Pericalcarine', 'Pericalcarine cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.postcentral', 'Left Hemisphere - Postcentral', 'Postcentral gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.posteriorcingulate', 'Left Hemisphere - Posterior Cingulate', 'Posterior cingulate cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.precentral', 'Left Hemisphere - Precentral', 'Precentral gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.precuneus', 'Left Hemisphere - Precuneus', 'Precuneus region in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.rostralanteriorcingulate', 'Left Hemisphere - Rostral Anterior Cingulate', 'Rostral anterior cingulate cortex in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.rostralmiddlefrontal', 'Left Hemisphere - Rostral Middle Frontal', 'Rostral middle frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.superiorfrontal', 'Left Hemisphere - Superior Frontal', 'Superior frontal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.superiorparietal', 'Left Hemisphere - Superior Parietal', 'Superior parietal lobule in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.superiortemporal', 'Left Hemisphere - Superior Temporal', 'Superior temporal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.supramarginal', 'Left Hemisphere - Supramarginal', 'Supramarginal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.transversetemporal', 'Left Hemisphere - Transverse Temporal', 'Transverse temporal gyrus in the left hemisphere'),
(gen_random_uuid(), 'lh.pial.DKT.unknown', 'Left Hemisphere - Unknown', 'Unlabeled region in the left hemisphere'),
-- Right Hemisphere
(gen_random_uuid(), 'rh.pial.DKT.caudalanteriorcingulate', 'Right Hemisphere - Caudal Anterior Cingulate', 'Anterior part of the cingulate gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.caudalmiddlefrontal', 'Right Hemisphere - Caudal Middle Frontal', 'Caudal portion of the middle frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.cuneus', 'Right Hemisphere - Cuneus', 'Cuneus region in the right hemisphere, part of the occipital lobe'),
(gen_random_uuid(), 'rh.pial.DKT.entorhinal', 'Right Hemisphere - Entorhinal', 'Entorhinal cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.fusiform', 'Right Hemisphere - Fusiform', 'Fusiform gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.inferiorparietal', 'Right Hemisphere - Inferior Parietal', 'Inferior parietal lobule in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.inferiortemporal', 'Right Hemisphere - Inferior Temporal', 'Inferior temporal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.insula', 'Right Hemisphere - Insula', 'Insular cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.isthmuscingulate', 'Right Hemisphere - Isthmus Cingulate', 'Isthmus of the cingulate gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.lateraloccipital', 'Right Hemisphere - Lateral Occipital', 'Lateral occipital cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.lateralorbitofrontal', 'Right Hemisphere - Lateral Orbitofrontal', 'Lateral orbitofrontal cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.lingual', 'Right Hemisphere - Lingual', 'Lingual gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.medialorbitofrontal', 'Right Hemisphere - Medial Orbitofrontal', 'Medial orbitofrontal cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.middletemporal', 'Right Hemisphere - Middle Temporal', 'Middle temporal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.paracentral', 'Right Hemisphere - Paracentral', 'Paracentral lobule in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.parahippocampal', 'Right Hemisphere - Parahippocampal', 'Parahippocampal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.parsopercularis', 'Right Hemisphere - Pars Opercularis', 'Pars opercularis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.parsorbitalis', 'Right Hemisphere - Pars Orbitalis', 'Pars orbitalis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.parstriangularis', 'Right Hemisphere - Pars Triangularis', 'Pars triangularis of the inferior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.pericalcarine', 'Right Hemisphere - Pericalcarine', 'Pericalcarine cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.postcentral', 'Right Hemisphere - Postcentral', 'Postcentral gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.posteriorcingulate', 'Right Hemisphere - Posterior Cingulate', 'Posterior cingulate cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.precentral', 'Right Hemisphere - Precentral', 'Precentral gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.precuneus', 'Right Hemisphere - Precuneus', 'Precuneus region in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.rostralanteriorcingulate', 'Right Hemisphere - Rostral Anterior Cingulate', 'Rostral anterior cingulate cortex in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.rostralmiddlefrontal', 'Right Hemisphere - Rostral Middle Frontal', 'Rostral middle frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.superiorfrontal', 'Right Hemisphere - Superior Frontal', 'Superior frontal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.superiorparietal', 'Right Hemisphere - Superior Parietal', 'Superior parietal lobule in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.superiortemporal', 'Right Hemisphere - Superior Temporal', 'Superior temporal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.supramarginal', 'Right Hemisphere - Supramarginal', 'Supramarginal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.transversetemporal', 'Right Hemisphere - Transverse Temporal', 'Transverse temporal gyrus in the right hemisphere'),
(gen_random_uuid(), 'rh.pial.DKT.unknown', 'Right Hemisphere - Unknown', 'Unlabeled region in the right hemisphere');
