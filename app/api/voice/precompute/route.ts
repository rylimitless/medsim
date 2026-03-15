import { NextRequest, NextResponse } from 'next/server';
import { MeshMatcher } from '@/app/services/mesh-matcher';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google GenAI API key not configured' },
        { status: 500 }
      );
    }

    const meshMatcher = new MeshMatcher(apiKey);

    console.log('[API] Starting precomputation of mesh embeddings...');

    await meshMatcher.precomputeMeshEmbeddings();

    return NextResponse.json({
      success: true,
      message: 'Mesh embeddings precomputed successfully'
    });

  } catch (error) {
    console.error('[API] Error precomputing embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to precompute embeddings' },
      { status: 500 }
    );
  }
}
