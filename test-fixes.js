const fs = require('fs');
const FormData = require('form-data');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = 'http://localhost:3000';

async function testTranscription() {
  console.log('\n=== Test 1: Audio Transcription ===');

  // Create a minimal valid audio file (1 second of silence in WebM format)
  // This is a minimal valid WebM header + audio data
  const minimalAudio = Buffer.from([
    // WebM header
    0x1A, 0x45, 0xDF, 0xA3, // EBML
    0x01, 0x00, 0x00, 0x00, // EBML version
    0x42, 0x82, 0x80, // DocType
    0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61, // "matroska"
    0x42, 0x87, 0x81, // DocTypeVersion
    0x01, // Version 1
    0x42, 0x85, 0x81, // DocTypeReadVersion
    0x01 // Version 1
  ]);

  const formData = new FormData();
  formData.append('audio', minimalAudio, {
    filename: 'test.webm',
    contentType: 'audio/webm'
  });

  try {
    const response = await fetch(`${baseUrl}/api/voice/transcribe`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Transcription API responded successfully');
      console.log('   Response:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.log('❌ Transcription API failed');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Transcription API error:', error.message);
    return false;
  }
}

async function testMeshMatching() {
  console.log('\n=== Test 2: Mesh Matching (UUID Fix) ===');

  try {
    const response = await fetch(`${baseUrl}/api/voice/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'prefrontal cortex'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Mesh matching API responded successfully');
      console.log('   Response:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.log('❌ Mesh matching API failed');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Mesh matching API error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Testing voice control fixes...\n');

  if (!apiKey) {
    console.error('Error: OPENROUTER_API_KEY is not set in .env');
    process.exit(1);
  }

  const transcriptionSuccess = await testTranscription();
  const matchingSuccess = await testMeshMatching();

  console.log('\n=== Test Results ===');
  console.log(`Transcription: ${transcriptionSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Mesh Matching: ${matchingSuccess ? '✅ PASS' : '❌ FAIL'}`);

  if (transcriptionSuccess && matchingSuccess) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
  }
}

runTests();
