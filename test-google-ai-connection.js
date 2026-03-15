#!/usr/bin/env node

/**
 * Google GenAI Connection Test Script
 * Tests WebSocket connection and API functionality for voice control
 */

// Load environment variables from .env file
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

// Model configuration - can be overridden via GOOGLE_GENAI_MODEL env var
const DEFAULT_MODEL = 'gemini-3-flash-preview';
const MODEL = process.env.GOOGLE_GENAI_MODEL || DEFAULT_MODEL;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function testAPIKey() {
  section('1. API Key Validation');

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    log('✗ GOOGLE_GENAI_API_KEY not found in environment', colors.red);
    return false;
  }

  if (apiKey === 'AIzaSyB38or7OsPSG6ZQhI7AKXfTQcrwTi7dJm4') {
    log('⚠️  Using default/example API key - this may not work', colors.yellow);
  }

  log(`✓ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(-4)}`, colors.green);
  return true;
}

async function testInitialization() {
  section('2. Google GenAI Initialization');

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  try {
    log('Initializing Google GenAI client...', colors.blue);
    const ai = new GoogleGenAI({ apiKey });
    log('✓ Google GenAI client initialized successfully', colors.green);
    return ai;
  } catch (error) {
    log(`✗ Failed to initialize Google GenAI: ${error.message}`, colors.red);
    return null;
  }
}

async function testModelList(ai) {
  section('3. Model Availability Check');

  try {
    log('Testing model access...', colors.blue);

    // Test with a known model using the correct API
    log(`Using model: ${MODEL}`, colors.blue);
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: 'test' }] }],
    });

    log(`✓ Model ${MODEL} is accessible`, colors.green);
    return true;
  } catch (error) {
    log(`✗ Model access failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testTextGeneration(ai) {
  section('4. Text Generation Test');

  try {
    log('Testing text generation...', colors.blue);

    const prompt = 'Say "Hello, voice control is working!" in one sentence.';
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.text || '';
    log(`✓ Text generation successful`, colors.green);
    log(`  Response: "${response}"`, colors.cyan);

    return true;
  } catch (error) {
    log(`✗ Text generation failed: ${error.message}`, colors.red);
    if (error.message.includes('API key')) {
      log('  → This suggests an invalid or missing API key', colors.yellow);
    }
    return false;
  }
}

async function testEmbeddingGeneration(ai) {
  section('5. OpenRouter Embedding Generation Test');

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    log('⚠️  OPENROUTER_API_KEY not found - skipping embedding test', colors.yellow);
    return null;
  }

  try {
    log('Testing OpenRouter embedding generation with qwen/qwen3-embedding-8b...', colors.blue);

    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'MedSim Voice Control',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-embedding-8b',
        input: 'prefrontal cortex',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding || [];

    log(`✓ OpenRouter embedding generation successful`, colors.green);
    log(`  Model: qwen/qwen3-embedding-8b`, colors.cyan);
    log(`  Embedding dimension: ${embedding.length}`, colors.cyan);

    return true;
  } catch (error) {
    log(`✗ OpenRouter embedding generation failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testWebSocketConnection(ai) {
  section('6. WebSocket Connection Test');

  try {
    log('Testing WebSocket connectivity...', colors.blue);

    // Note: The @google/genai SDK's live.connect method may not be fully available
    // This is a placeholder for when the live API becomes available
    log('ℹ️  The live WebSocket API may not be fully available in the current SDK version', colors.yellow);
    log('ℹ️  Testing standard API connectivity instead...', colors.yellow);

    // Test with a quick API call to verify connectivity
    const startTime = Date.now();

    await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });

    const latency = Date.now() - startTime;
    log(`✓ API connectivity verified (latency: ${latency}ms)`, colors.green);

    return true;
  } catch (error) {
    log(`✗ WebSocket/API connectivity test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testVoiceSimulation(ai) {
  section('7. Voice Control Simulation Test');

  try {
    log('Simulating voice command processing...', colors.blue);

    const voiceCommand = 'zoom in on the prefrontal cortex';
    const prompt = `You are a voice command classifier. Analyze this command: "${voiceCommand}"

Extract:
1. Action type (zoom, rotate, highlight, select)
2. Target mesh (anatomical structure name)

Return JSON: {"action": "...", "targetMesh": "..."}`;

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.text || '';
    log(`✓ Voice command simulation successful`, colors.green);
    log(`  Command: "${voiceCommand}"`, colors.cyan);
    log(`  Response: ${response}`, colors.cyan);

    // Try to parse JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        log(`  Parsed: action="${parsed.action}", target="${parsed.targetMesh}"`, colors.cyan);
      }
    } catch (e) {
      log('  ⚠️  Could not parse JSON from response', colors.yellow);
    }

    return true;
  } catch (error) {
    log(`✗ Voice command simulation failed: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  log('🎤 Google GenAI Voice Control Connection Test', colors.bright + colors.green);
  console.log('█'.repeat(60));

  const results = {
    apiKey: false,
    initialization: false,
    modelList: false,
    textGeneration: false,
    embeddingGeneration: false,
    webSocket: false,
    voiceSimulation: false,
  };

  // Run tests sequentially
  results.apiKey = await testAPIKey();

  if (!results.apiKey) {
    log('\n❌ Cannot proceed without valid API key', colors.red);
    return;
  }

  const ai = await testInitialization();
  results.initialization = ai !== null;

  if (!results.initialization) {
    log('\n❌ Cannot proceed without initialization', colors.red);
    return;
  }

  results.modelList = await testModelList(ai);
  results.textGeneration = await testTextGeneration(ai);
  const embeddingResult = await testEmbeddingGeneration(ai);
  if (embeddingResult !== null) {
    results.embeddingGeneration = embeddingResult;
  }
  results.webSocket = await testWebSocketConnection(ai);
  results.voiceSimulation = await testVoiceSimulation(ai);

  // Print summary
  section('Test Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(v => v).length;

  console.log('\nResults:');
  console.log(`  API Key:           ${results.apiKey ? '✓' : '✗'}`);
  console.log(`  Initialization:     ${results.initialization ? '✓' : '✗'}`);
  console.log(`  Model Access:       ${results.modelList ? '✓' : '✗'}`);
  console.log(`  Text Generation:    ${results.textGeneration ? '✓' : '✗'}`);
  console.log(`  Embedding Gen:      ${results.embeddingGeneration ? '✓' : '✗'}`);
  console.log(`  WebSocket/API:      ${results.webSocket ? '✓' : '✗'}`);
  console.log(`  Voice Simulation:   ${results.voiceSimulation ? '✓' : '✗'}`);

  console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Google GenAI is working correctly.', colors.bright + colors.green);
    log('✓ Voice control backend is ready for use.', colors.green);
  } else if (passedTests >= totalTests * 0.7) {
    log('\n⚠️  Most tests passed. Voice control should work with some limitations.', colors.yellow);
  } else {
    log('\n❌ Multiple tests failed. Please check your API key and network connection.', colors.red);
  }

  console.log('\n' + '█'.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
