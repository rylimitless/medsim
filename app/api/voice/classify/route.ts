import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { EmbeddingService } from '@/app/services/embedding-service';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /voice/classify] Request received');
    const { transcription } = await request.json();
    console.log('[API /voice/classify] Transcription:', transcription);

    if (!transcription) {
      console.log('[API /voice/classify] Error: transcription is required');
      return NextResponse.json(
        { error: 'transcription is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('[API /voice/classify] API Key present:', !!apiKey);
    if (!apiKey) {
      console.log('[API /voice/classify] Error: API key not configured');
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const model = process.env.OPENROUTER_CLASSIFICATION_MODEL || 'google/gemini-3-flash-preview';
    console.log('[API /voice/classify] Using model:', model);

    const prompt = `You are a voice command classifier for a 3D medical mesh navigation system.

  Analyze the following voice command and extract:
  1. Action type: zoom, rotate, highlight, select, or query
  2. Target mesh: the anatomical structure name (e.g., "prefrontal cortex", "left hemisphere", "insula")
  3. Parameters: any numeric values or modifiers (e.g., zoom level, rotation degrees, axis)

  Voice command: "${transcription}"

  Return ONLY a valid JSON object in this exact format:
  {
    "action": "action_type",
    "targetMesh": "mesh_name",
    "parameters": {},
    "response": "brief_answer_if_query",
    "confidence": 0.95
  }

  Rules:
  - Action must be one of: "zoom", "rotate", "highlight", "select", "query"
  - If no specific mesh is mentioned, use "scene" or "model"
  - For "query" action, provide a concise, professional medical response in the "response" field
  - Extract zoom level if mentioned (e.g., "zoom in 2x" -> level: 2.0)
  - Extract rotation degrees and axis if mentioned (e.g., "rotate 45 degrees" -> degrees: 45, axis: "y")
  - Extract color if mentioned for highlight (e.g., "highlight red" -> color: "#ff0000")
  - Confidence should be between 0.0 and 1.0 based on how clear the command is
  - Return confidence < 0.5 if the command is unclear or ambiguous`;

    console.log('[API /voice/classify] About to call OpenRouter API...');
    const startTime = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'MedSim Voice Control',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const duration = Date.now() - startTime;
    console.log('[API /voice/classify] OpenRouter API completed in', duration, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API /voice/classify] OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    console.log('[API /voice/classify] Response text length:', responseText.length);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[API /voice/classify] No JSON found in response:', responseText);
      return NextResponse.json(
        { error: 'No valid JSON found in response' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[API /voice/classify] Failed to parse JSON:', jsonMatch[0]);
      return NextResponse.json(
        { error: 'Failed to parse JSON from response' },
        { status: 500 }
      );
    }

    // Log message to database and generate embedding
    try {
      const db = getPool();
      const messageId = randomUUID();
      
      console.log('[API /voice/classify] Logging message to database:', messageId);
      
      // 1. Store the user message
      await db.query(
        'INSERT INTO messages (id, role, content, created_at) VALUES ($1, $2, $3, NOW())',
        [messageId, 'user', transcription]
      );

      // 2. Generate and store embedding for semantic search
      const embeddingService = new EmbeddingService(apiKey);
      await embeddingService.generateEmbedding({
        text: transcription,
        sourceType: 'message',
        messageId: messageId,
        store: true
      });
      
      console.log('[API /voice/classify] Message logged and embedded successfully');
      
      // Add messageId to the response so the client knows it was logged
      parsed.messageId = messageId;
    } catch (dbError) {
      // Don't fail the whole request if DB logging fails, but log the error
      console.error('[API /voice/classify] Database logging error:', dbError);
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('[API /voice/classify] Error:', error);
    console.error('[API /voice/classify] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to classify intent' },
      { status: 500 }
    );
  }
}
