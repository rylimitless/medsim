import { NextRequest, NextResponse } from 'next/server';
import { MeshMatcher } from '@/app/services/mesh-matcher';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const meshMatcher = new MeshMatcher(apiKey);
    const match = await meshMatcher.findBestMatch(query);

    if (!match) {
      return NextResponse.json({ match: null });
    }

    return NextResponse.json({
      match: {
        meshId: match.meshId,
        meshName: match.meshName,
        displayName: match.displayName,
        similarity: match.similarity,
      },
    });

  } catch (error) {
    console.error('[API] Error matching mesh:', error);
    return NextResponse.json(
      { error: 'Failed to match mesh' },
      { status: 500 }
    );
  }
}
