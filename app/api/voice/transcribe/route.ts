import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /voice/transcribe] Request received');

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'audio file is required' },
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

    const model = process.env.OPENROUTER_TRANSCRIPTION_MODEL || 'google/gemini-2.5-flash';
    console.log('[API /voice/transcribe] Using model:', model);

    // Convert audio file to Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    // Determine audio format for OpenRouter
    // Supported: wav, mp3, aiff, aac, ogg, flac, m4a, pcm16, pcm24
    let format = 'wav';
    const type = audioFile.type.toLowerCase();
    
    if (type.includes('wav')) format = 'wav';
    else if (type.includes('mp3') || type.includes('mpeg')) format = 'mp3';
    else if (type.includes('ogg')) format = 'ogg';
    else if (type.includes('aac')) format = 'aac';
    else if (type.includes('flac')) format = 'flac';
    else if (type.includes('m4a')) format = 'm4a';
    else if (type.includes('webm')) {
      // OpenRouter doesn't explicitly list webm in their general docs, but many providers support it.
      // If the provider is Google (Gemini), webm is natively supported.
      // We'll try 'webm' and fallback to 'wav' if it's a generic provider.
      format = 'webm';
    }

    // Use multimodal chat completions for transcription
    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe this audio file. Return ONLY the transcribed text, nothing else.'
            },
            {
              type: 'input_audio',
              input_audio: {
                data: base64Audio,
                format: format
              }
            }
          ]
        }
      ],
      stream: false
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'MedSim Voice Control',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API /voice/transcribe] OpenRouter API error:', response.status, errorText);
      
      // If webm failed, try one more time as 'wav' - sometimes the label is the only issue
      if (format === 'webm' && response.status === 400) {
        const retryPayload = { ...payload, messages: [{ ...payload.messages[0], content: [payload.messages[0].content[0], { ...payload.messages[0].content[1], input_audio: { ...payload.messages[0].content[1].input_audio, format: 'wav' } }] }] };
        const retryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
            'X-Title': 'MedSim Voice Control',
          },
          body: JSON.stringify(retryPayload),
        });
        
        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          const retryTranscription = retryResult.choices?.[0]?.message?.content || '';
          return NextResponse.json({ text: retryTranscription.trim() });
        }
      }

      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    const transcription = result.choices?.[0]?.message?.content || '';
    
    return NextResponse.json({
      text: transcription.trim(),
    });

  } catch (error) {
    console.error('[API /voice/transcribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
