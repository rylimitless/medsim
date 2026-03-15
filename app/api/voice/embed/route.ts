import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingService } from '@/app/services/embedding-service';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const embeddingService = new EmbeddingService(apiKey);
    
    // We don't have a specific structureId here since it's a general embedding request
    // but the generateEmbedding method requires it for storage.
    // For general use, we might want a different method or just use a dummy ID.
    // However, the current generateEmbedding also stores it in the DB.
    
    // Let's use the fetch logic directly if we don't want to store it, 
    // or just call generateEmbedding with a dummy ID.
    
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'MedSim Voice Control',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_EMBEDDING_MODEL || 'qwen/qwen3-embedding-8b',
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const embedding = result.data?.[0]?.embedding || [];

    return NextResponse.json({ embedding });

  } catch (error) {
    console.error('[API] Error generating embedding:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
