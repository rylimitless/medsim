import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json(
        { error: 'transcription is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google GenAI API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GOOGLE_GENAI_MODEL || 'gemini-3-flash-preview';

    const prompt = `You are a voice command classifier for a 3D medical mesh navigation system.

  Analyze the following voice command and extract:
  1. Action type: zoom, rotate, highlight, or select
  2. Target mesh: the anatomical structure name (e.g., "prefrontal cortex", "left hemisphere", "insula")
  3. Parameters: any numeric values or modifiers (e.g., zoom level, rotation degrees, axis)

  Voice command: "${transcription}"

  Return ONLY a valid JSON object in this exact format:
  {
    "action": "action_type",
    "targetMesh": "mesh_name",
    "parameters": {},
    "confidence": 0.95
  }

  Rules:
  - Action must be one of: "zoom", "rotate", "highlight", "select"
  - If no specific mesh is mentioned, use "scene" or "model"
  - Extract zoom level if mentioned (e.g., "zoom in 2x" -> level: 2.0)
  - Extract rotation degrees and axis if mentioned (e.g., "rotate 45 degrees" -> degrees: 45, axis: "y")
  - Extract color if mentioned for highlight (e.g., "highlight red" -> color: "#ff0000")
  - Confidence should be between 0.0 and 1.0 based on how clear the command is
  - Return confidence < 0.5 if the command is unclear or ambiguous`;

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.text || '';

    // Extract JSON from response
    const jsonMatch = new RegExp(/\{[\s\S]*\}/).exec(responseText);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'No valid JSON found in response' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('[API] Error classifying intent:', error);
    return NextResponse.json(
      { error: 'Failed to classify intent' },
      { status: 500 }
    );
  }
}
