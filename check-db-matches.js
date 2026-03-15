const { Client } = require('pg');
require('dotenv').config();

async function checkMatches() {
  const query = "prefrontal cortex";
  console.log('Query:', query);

  // 1. Get embedding
  const response = await fetch('http://localhost:3000/api/voice/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: query }),
  });

  if (!response.ok) {
    console.error('Failed to get embedding:', await response.text());
    return;
  }

  const { embedding } = await response.json();
  console.log('Embedding length:', embedding.length);

  // 2. Query database
  const client = new Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: 'localhost',
    database: process.env.POSTGRES_DB,
  });

  await client.connect();

  try {
    const vectorString = `[${embedding.join(',')}]`;
    const res = await client.query(`
      SELECT
        s.id as mesh_id,
        s.mesh_name,
        s.display_name,
        e.embedding <=> $1::vector as distance
      FROM structures s
      JOIN embeddings e ON e.structure_id = s.id
      WHERE e.source_type = 'mesh_name'
      ORDER BY distance ASC
      LIMIT 10
    `, [vectorString]);

    console.log('\nTop 10 matches:');
    res.rows.forEach((r, i) => {
      console.log(`${i+1}. ${r.display_name} - distance: ${r.distance}`);
    });

  } finally {
    await client.end();
  }
}

checkMatches().catch(console.error);
