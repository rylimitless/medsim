#!/usr/bin/env tsx
/**
 * Precompute embeddings for all mesh names in the database
 * Run this script to populate the embeddings table with semantic vectors
 */

import * as fs from 'fs';
import * as path from 'path';
import { MeshMatcher } from '../app/services/mesh-matcher';

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function main() {
  console.log('Starting precomputation of mesh embeddings...');

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('ERROR: OPENROUTER_API_KEY environment variable is not set');
    console.error('Please set it in your .env file or export it before running this script');
    console.error('Get your API key from: https://openrouter.ai/keys');
    process.exit(1);
  }

  const meshMatcher = new MeshMatcher(apiKey);

  try {
    await meshMatcher.precomputeMeshEmbeddings();
    console.log('\n✅ Precomputation completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during precomputation:', error);
    process.exit(1);
  }
}

main();
