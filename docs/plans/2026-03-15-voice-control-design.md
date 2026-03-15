# Voice Control System Design Document

**Date:** 2026-03-15
**Project:** MedSim - Medical Simulation with 3D Mesh Navigation
**Status:** Design Complete

## Executive Summary

Design a real-time voice control interface for 3D medical mesh navigation using Google GenAI SDK Live. The system enables users to control meshes (zoom, rotate, highlight, select) through natural voice commands with sub-1.5 second latency, bypassing hosting platform limitations through client-side WebSocket connections.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Integration Points](#integration-points)
6. [Error Handling](#error-handling)
7. [Voice Command History](#voice-command-history)
8. [User Feedback Mechanism](#user-feedback-mechanism)
9. [Technology Stack](#technology-stack)
10. [Implementation Considerations](#implementation-considerations)

---

## System Overview

### Problem Statement
Enable audio-only control interface for 3D medical mesh navigation without text input or chat interface. Users should be able to speak commands like "select the prefrontal cortex" or "zoom in on the left hemisphere" and have the system automatically navigate to and highlight specific 3D meshes.

### Requirements
- **Latency:** Under 1.5 seconds from voice input to mesh response
- **Interface:** Audio-only, no text input or chat interface
- **Actions:** Zoom, rotate, highlight, select (extensible for more actions)
- **Platform:** Works on Sevalla (or any hosting platform)
- **AI:** Model-agnostic, configurable via OpenRouter
- **Embeddings:** Use Qwen 3 8B Embedding Model for semantic mesh matching
- **UI:** shadcn components

### Solution Approach
Use Google GenAI SDK Live with client-side WebSocket connections to achieve sub-1.5s latency. The WebSocket connection bypasses hosting platform limitations by connecting directly from browser to Google's servers.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Client-Side)                     │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ VoiceCapture  │  │      Google GenAI SDK Live       │ │
│  │   Service    │  │    (WebSocket Connection)         │ │
│  │              │  │                                  │ │
│  │ Web Audio    │  │  gemini-live-3.0-flash-preview  │ │
│  │ API          │  │                                  │ │
│  └──────┬───────┘  └──────────┬───────────────────────┘ │
│         │                      │                          │
│         │ Audio Chunks          │ Transcribed Text          │
│         ▼                      ▼                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Intent Classifier                       │ │
│  │  (Extract: action, mesh, parameters)          │ │
│  └──────────────────┬───────────────────────────────┘ │
│                     │                                   │
│                     ▼                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Mesh Matcher                         │ │
│  │    (pgvector cosine similarity search)          │ │
│  └──────────────────┬───────────────────────────────┘ │
│                     │                                   │
│                     ▼                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Action Controller                        │ │
│  │    (Update Zustand store)                       │ │
│  └──────────────────┬───────────────────────────────┘ │
│                     │                                   │
│                     ▼                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │      React Three Fiber Scene                     │ │
│  │    (Execute: zoom, rotate, highlight)          │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Client-Side WebSocket**: Direct browser-to-Google connection ensures sub-1.5s latency
2. **Real-Time Streaming**: Audio chunks sent continuously, not waiting for complete sentences
3. **Semantic Matching**: Use embeddings to match voice commands to mesh names
4. **State Management**: Leverage existing Zustand store for mesh control
5. **Memory-Only History**: Fast access, no database overhead
6. **Targeted Feedback**: Only shown on failures, non-intrusive

---

## Core Components

### 1. VoiceCaptureService

**Purpose:** Capture audio from microphone and stream to Google GenAI

**Responsibilities:**
- Request microphone permissions from user
- Initialize Web Audio API with MediaRecorder
- Capture 16kHz mono audio chunks
- Stream audio chunks to GoogleLiveService
- Handle microphone errors (permission denied, not found)

**Technical Details:**
```typescript
interface AudioChunk {
  data: Blob;
  timestamp: number;
}

class VoiceCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  async startCapture(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 16000
    });
    this.mediaRecorder.ondataavailable = (event) => {
      this.emit('audioChunk', {
        data: event.data,
        timestamp: Date.now()
      });
    };
    this.mediaRecorder.start(100); // Send chunks every 100ms
  }

  stopCapture(): void {
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach(track => track.stop());
  }
}
```

**Error Handling:**
- Permission denied → Show error dialog with instructions
- Microphone not found → Show error and suggest checking devices
- Capture failure → Log error and retry with backoff

---

### 2. GoogleLiveService

**Purpose:** Manage WebSocket connection to Google GenAI SDK Live

**Responsibilities:**
- Establish WebSocket connection to `gemini-live-3.0-flash-preview`
- Handle connection lifecycle (connect, disconnect, reconnect)
- Send audio chunks via `sendRealtimeInput()`
- Receive transcribed text and model responses
- Route messages to appropriate handlers
- Handle connection failures with exponential backoff

**Technical Details:**
```typescript
import { GoogleGenAI, Modality } from '@google/genai';

class GoogleLiveService {
  private session: Session | null = null;
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(): Promise<void> {
    this.session = await this.ai.live.connect({
      model: 'gemini-live-3.0-flash-preview',
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => console.log('Connected to Google GenAI'),
        onmessage: (msg) => this.handleMessage(msg),
        onerror: (error) => this.handleError(error),
        onclose: () => this.handleClose(),
      },
    });
  }

  sendAudio(audioChunk: Blob): void {
    this.session?.sendRealtimeInput({ media: audioChunk });
  }

  private handleMessage(msg: LiveServerMessage): void {
    if (msg.serverContent) {
      const text = msg.serverContent.modelTurn?.parts?.[0]?.text;
      if (text) {
        this.emit('transcription', text);
      }
    }
  }
}
```

**Connection Management:**
- Exponential backoff on failure: 1s, 2s, 4s, 8s
- Automatic reconnection on disconnect
- Connection status tracking (connecting, connected, disconnected, error)

---

### 3. IntentClassifier

**Purpose:** Extract intent from transcribed voice commands

**Responsibilities:**
- Parse transcribed text into structured intent
- Extract action type (zoom, rotate, highlight, select)
- Extract target mesh name
- Extract parameters (zoom level, rotation degrees, etc.)
- Handle ambiguous or unclear intents

**Technical Details:**
```typescript
interface Intent {
  action: 'zoom' | 'rotate' | 'highlight' | 'select';
  targetMesh: string;
  parameters: Record<string, any>;
  confidence: number;
}

class IntentClassifier {
  async classify(transcription: string): Promise<Intent> {
    const prompt = `
You are a voice command classifier for a 3D medical mesh navigation system.

Analyze the following voice command and extract:
1. Action type: zoom, rotate, highlight, or select
2. Target mesh: the anatomical structure name
3. Parameters: any numeric values or modifiers

Voice command: "${transcription}"

Return JSON format:
{
  "action": "action_type",
  "targetMesh": "mesh_name",
  "parameters": {},
  "confidence": 0.0-1.0
}
`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return JSON.parse(response.text);
  }
}
```

**Intent Types:**
- `zoom`: Zoom in/out on specific mesh or overall scene
- `rotate`: Rotate mesh or camera (degrees, axis)
- `highlight`: Highlight specific mesh with color
- `select`: Select/focus on specific mesh

**Error Handling:**
- Invalid action type → Return error intent
- No mesh found → Return null targetMesh
- Low confidence → Ask for clarification

---

### 4. MeshMatcher

**Purpose:** Match user query to correct mesh using semantic similarity

**Responsibilities:**
- Query PostgreSQL with pgvector for cosine similarity
- Compare user query embedding with pre-computed mesh name embeddings
- Return best-matching mesh ID
- Handle no match or low confidence scenarios

**Technical Details:**
```typescript
interface MeshMatch {
  meshId: string;
  meshName: string;
  displayName: string;
  similarity: number;
}

class MeshMatcher {
  async findBestMatch(query: string): Promise<MeshMatch | null> {
    // Generate embedding for query
    const embedding = await this.generateEmbedding(query);

    // Query database for similarity search
    const result = await this.db.query(`
      SELECT
        s.id as mesh_id,
        s.mesh_name,
        s.display_name,
        e.embedding <=> $1 as similarity
      FROM structures s
      JOIN embeddings e ON e.structure_id = s.id
      WHERE e.source_type = 'mesh_name'
      ORDER BY similarity DESC
      LIMIT 5
    `, [embedding]);

    if (result.rows.length === 0) {
      return null;
    }

    // Return best match if similarity > threshold
    const bestMatch = result.rows[0];
    if (bestMatch.similarity > 0.7) {
      return {
        meshId: bestMatch.mesh_id,
        meshName: bestMatch.mesh_name,
        displayName: bestMatch.display_name,
        similarity: bestMatch.similarity
      };
    }

    return null;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenRouter with Qwen 3 8B Embedding Model
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-7b-instruct',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

**Similarity Thresholds:**
- High confidence: > 0.85 (direct match)
- Medium confidence: 0.7 - 0.85 (semantic match)
- Low confidence: < 0.7 (no match, ask for clarification)

---

### 5. ActionController

**Purpose:** Execute actions on 3D meshes

**Responsibilities:**
- Update Zustand store with action and parameters
- Trigger React Three Fiber scene updates
- Handle action execution errors
- Provide feedback on action completion

**Technical Details:**
```typescript
class ActionController {
  constructor(private store: ControlStore) {}

  async executeIntent(intent: Intent, meshMatch: MeshMatch): Promise<void> {
    try {
      switch (intent.action) {
        case 'zoom':
          await this.executeZoom(intent, meshMatch);
          break;
        case 'rotate':
          await this.executeRotate(intent, meshMatch);
          break;
        case 'highlight':
          await this.executeHighlight(intent, meshMatch);
          break;
        case 'select':
          await this.executeSelect(intent, meshMatch);
          break;
      }
    } catch (error) {
      this.store.setError(error.message);
    }
  }

  private async executeZoom(intent: Intent, meshMatch: MeshMatch): Promise<void> {
    const level = intent.parameters.level || 1.5;
    this.store.setZoomLevel(level);
    this.store.setTargetMesh(meshMatch.meshId);
  }

  private async executeRotate(intent: Intent, meshMatch: MeshMatch): Promise<void> {
    const degrees = intent.parameters.degrees || 45;
    const axis = intent.parameters.axis || 'y';
    this.store.rotateMesh(meshMatch.meshId, degrees, axis);
  }

  private async executeHighlight(intent: Intent, meshMatch: MeshMatch): Promise<void> {
    const color = intent.parameters.color || '#ff0000';
    this.store.highlightMesh(meshMatch.meshId, color);
  }

  private async executeSelect(intent: Intent, meshMatch: MeshMatch): Promise<void> {
    this.store.selectMesh(meshMatch.meshId);
    this.store.focusOnMesh(meshMatch.meshId);
  }
}
```

---

## Data Flow

### Complete Pipeline

```
1. User speaks command
   ↓
2. VoiceCaptureService captures audio (16kHz mono chunks)
   ↓
3. GoogleLiveService sends audio via WebSocket (sendRealtimeInput)
   ↓
4. Google GenAI performs speech-to-text with VAD
   ↓
5. Transcribed text received
   ↓
6. IntentClassifier extracts: action, targetMesh, parameters
   ↓
7. MeshMatcher queries pgvector for semantic similarity
   ↓
8. Best matching mesh found (or null)
   ↓
9. ActionController executes action on Zustand store
   ↓
10. React Three Fiber scene updates (zoom/rotate/highlight)
   ↓
11. Voice command stored in history (memory only)
   ↓
12. User feedback collected (if action failed)
```

### Latency Breakdown

| Step | Estimated Time | Cumulative |
|-------|----------------|--------------|
| Audio capture & streaming | 0-100ms | 100ms |
| Speech-to-text (Google GenAI) | 300-500ms | 600ms |
| Intent classification | 100-200ms | 800ms |
| Mesh matching (pgvector) | 50-100ms | 900ms |
| Action execution | 100-200ms | 1100ms |
| Scene update (Three.js) | 100-200ms | 1300ms |
| **Total** | **1.0-1.3s** | **< 1.5s ✅** |

---

## Integration Points

### 1. Zustand Store Extension

**File:** `app/store/control_store.ts`

```typescript
interface VoiceCommandState {
  // Voice control state
  isListening: boolean;
  currentCommand: string;
  lastTranscript: string;
  error: string | null;

  // Voice command history (memory only, last 50)
  commandHistory: VoiceCommand[];

  // Actions
  setListening: (value: boolean) => void;
  setCurrentCommand: (command: string) => void;
  setLastTranscript: (transcript: string) => void;
  setError: (error: string | null) => void;
  addCommandToHistory: (command: VoiceCommand) => void;
  clearHistory: () => void;
}

interface VoiceCommand {
  id: string;
  timestamp: number;
  userQuery: string;
  intentType: string;
  targetMeshId: string | null;
  actionParameters: Record<string, any>;
  executionStatus: 'success' | 'failed';
  errorMessage: string | null;
  feedback?: {
    type: 'wrong_action' | 'wrong_mesh' | 'other';
    timestamp: number;
  };
}

export const useControlStore = create<ControlStore & VoiceCommandState>((set) => ({
  ...existingState,

  // Voice control state
  isListening: false,
  currentCommand: '',
  lastTranscript: '',
  error: null,
  commandHistory: [],

  // Voice control actions
  setListening: (value) => set({ isListening: value }),
  setCurrentCommand: (command) => set({ currentCommand: command }),
  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),
  setError: (error) => set({ error }),

  addCommandToHistory: (command) => set((state) => ({
    commandHistory: [command, ...state.commandHistory].slice(0, 50)
  })),

  clearHistory: () => set({ commandHistory: [] })
}));
```

### 2. API Routes

**New Routes to Create:**

#### `app/api/voice/embed/route.ts`
Generate embeddings for mesh names using OpenRouter

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-7b-instruct',
      input: text
    })
  });

  const data = await response.json();
  return NextResponse.json({ embedding: data.data[0].embedding });
}
```

#### `app/api/voice/match/route.ts`
Find matching mesh using pgvector

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  // Generate embedding
  const embedResponse = await fetch('http://localhost:3000/api/voice/embed', {
    method: 'POST',
    body: JSON.stringify({ text: query })
  });
  const { embedding } = await embedResponse.json();

  // Query database
  const result = await pool.query(`
    SELECT
      s.id,
      s.mesh_name,
      s.display_name,
      e.embedding <=> $1 as similarity
    FROM structures s
    JOIN embeddings e ON e.structure_id = s.id
    WHERE e.source_type = 'mesh_name'
    ORDER BY similarity DESC
    LIMIT 5
  `, [embedding]);

  return NextResponse.json({ matches: result.rows });
}
```

### 3. Model Page Integration

**File:** `app/model/page.tsx`

```typescript
'use client';

import { useControlStore } from '@/store/control_store';
import { VoiceCaptureService } from '@/services/voice-capture';
import { GoogleLiveService } from '@/services/google-live';
import { IntentClassifier } from '@/services/intent-classifier';
import { MeshMatcher } from '@/services/mesh-matcher';
import { ActionController } from '@/services/action-controller';

export default function ModelPage() {
  const { isListening, lastTranscript, error } = useControlStore();

  useEffect(() => {
    // Initialize services
    const voiceCapture = new VoiceCaptureService();
    const googleLive = new GoogleLiveService(process.env.GOOGLE_GENAI_API_KEY);
    const intentClassifier = new IntentClassifier();
    const meshMatcher = new MeshMatcher();
    const actionController = new ActionController(useControlStore.getState());

    // Setup audio capture
    voiceCapture.on('audioChunk', (chunk) => {
      googleLive.sendAudio(chunk.data);
    });

    // Handle transcriptions
    googleLive.on('transcription', async (text) => {
      const intent = await intentClassifier.classify(text);
      const meshMatch = await meshMatcher.findBestMatch(intent.targetMesh);

      if (meshMatch) {
        await actionController.executeIntent(intent, meshMatch);
      } else {
        useControlStore.getState().setError('Mesh not found');
      }
    });

    // Start listening
    voiceCapture.startCapture();
    await googleLive.connect();

    return () => {
      voiceCapture.stopCapture();
      googleLive.disconnect();
    };
  }, []);

  return (
    <div>
      {/* 3D Scene */}
      <Canvas>
        {/* Existing Three.js components */}
      </Canvas>

      {/* Voice Status Indicator */}
      <div className="fixed top-4 right-4">
        {isListening && (
          <div className="bg-green-500 text-white px-4 py-2 rounded">
            🎤 Listening...
          </div>
        )}
        {lastTranscript && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            {lastTranscript}
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. Environment Variables

**File:** `.env.example`

```bash
# PostgreSQL Configuration
POSTGRES_USER=medsim
POSTGRES_PASSWORD=medsim_password
POSTGRES_DB=medsim

# Google GenAI API Key (for voice control)
GOOGLE_GENAI_API_KEY=your_google_genai_api_key

# OpenRouter API Key (for embeddings)
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## Error Handling

### Error Categories & Responses

| Error Type | Detection | User Message | Recovery |
|-------------|-----------|---------------|-----------|
| **Microphone Permission Denied** | `getUserMedia` throws error | "Please enable microphone access in your browser settings" | Guide user to browser permissions |
| **Microphone Not Found** | No audio devices available | "No microphone found. Please check your audio devices" | Suggest checking device settings |
| **WebSocket Connection Failed** | `onerror` callback triggered | "Connection failed. Retrying..." | Exponential backoff retry |
| **No Speech Detected** | Timeout (5s) without transcription | "Listening..." indicator | Continue listening |
| **Intent Not Understood** | Low confidence or null intent | "I didn't understand. Please try again." | Ask user to rephrase |
| **Mesh Not Found** | No match or low similarity | "Mesh not found. Available meshes: [list]" | Show available meshes |
| **Action Execution Failed** | Exception in action controller | "Action failed: [error]. Retry?" | Offer retry option |

### Retry Strategy

**Exponential Backoff:**
- Attempt 1: Immediate
- Attempt 2: Wait 1s
- Attempt 3: Wait 2s
- Attempt 4: Wait 4s
- Attempt 5: Wait 8s
- After 5 failures: Show "Connection failed. Please refresh."

**Max Retries per Session:** 5

### Error Logging

All errors logged to console with:
```typescript
console.error('[VoiceControl]', {
  timestamp: new Date().toISOString(),
  error: error.message,
  stack: error.stack,
  context: {
    isListening: store.isListening,
    lastTranscript: store.lastTranscript,
    currentCommand: store.currentCommand
  }
});
```

---

## Voice Command History

### Purpose

Track voice commands for debugging and user reference. Stored in memory only (no database) for fast access.

### Data Structure

```typescript
interface VoiceCommand {
  id: string;                    // UUID
  timestamp: number;               // Unix timestamp
  userQuery: string;              // Transcribed text
  intentType: string;             // zoom, rotate, highlight, select
  targetMeshId: string | null;    // UUID or null if not found
  actionParameters: Record<string, any>;
  executionStatus: 'success' | 'failed';
  errorMessage: string | null;
  feedback?: {
    type: 'wrong_action' | 'wrong_mesh' | 'other';
    timestamp: number;
  };
}
```

### Storage Limits

- **Maximum commands:** 50
- **Retention:** Session-based (cleared on page refresh)
- **Access:** Via Zustand store `useControlStore.getState().commandHistory`

### Usage Example

```typescript
// Add command to history
const command: VoiceCommand = {
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  userQuery: 'zoom in on the prefrontal cortex',
  intentType: 'zoom',
  targetMeshId: 'mesh-uuid',
  actionParameters: { level: 2.0 },
  executionStatus: 'success',
  errorMessage: null
};

useControlStore.getState().addCommandToHistory(command);

// Access history
const history = useControlStore.getState().commandHistory;

// Clear history
useControlStore.getState().clearHistory();
```

---

## User Feedback Mechanism

### Purpose

Collect user feedback only when commands fail, to improve intent classification over time.

### Trigger Conditions

Feedback is **only** shown when:
1. No matching mesh found for query
2. Intent classification fails (low confidence or null)
3. Action execution fails (exception thrown)

### Feedback UI

```typescript
interface FeedbackPrompt {
  show: boolean;
  message: string;
  options: FeedbackOption[];
}

interface FeedbackOption {
  id: string;
  label: string;
  type: 'wrong_action' | 'wrong_mesh' | 'other';
}

const feedbackPrompt: FeedbackPrompt = {
  show: true,
  message: "I couldn't complete that command. Can you help me improve?",
  options: [
    { id: '1', label: 'Wrong action type', type: 'wrong_action' },
    { id: '2', label: 'Wrong mesh name', type: 'wrong_mesh' },
    { id: '3', label: 'Other issue', type: 'other' }
  ]
};
```

### Feedback Collection

```typescript
function handleFeedback(feedbackType: string) {
  const lastCommand = useControlStore.getState().commandHistory[0];

  if (lastCommand) {
    const updatedCommand = {
      ...lastCommand,
      feedback: {
        type: feedbackType,
        timestamp: Date.now()
      }
    };

    useControlStore.getState().addCommandToHistory(updatedCommand);

    // Log feedback for analysis
    console.log('[VoiceControl] Feedback received:', updatedCommand);
  }

  // Hide feedback prompt
  useControlStore.getState().setError(null);
}
```

### Feedback Analysis

Periodic analysis of feedback to improve:
- Intent classification prompts
- Mesh matching thresholds
- Parameter extraction accuracy

---

## Technology Stack

### Frontend

- **Framework:** Next.js 16.1.6
- **UI Library:** React 19.2.3
- **3D Rendering:** React Three Fiber 9.5.0, Three.js 0.183.2
- **State Management:** Zustand 5.0.11
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui

### AI & ML

- **Voice Recognition:** Google GenAI SDK Live (`@google/genai`)
- **Model:** `gemini-live-3.0-flash-preview`
- **Embeddings:** OpenRouter API
- **Embedding Model:** Qwen 3 8B (qwen/qwen-2.5-7b-instruct)
- **Intent Classification:** Gemini 2.5 Flash

### Database

- **Database:** PostgreSQL 17 with pgvector extension
- **Vector Operations:** Cosine similarity search
- **Tables:**
  - `structures` - Mesh metadata
  - `embeddings` - Pre-computed embeddings (4096 dimensions)
  - `messages` - Chat history (optional, not used in voice control)

### Audio

- **Capture:** Web Audio API, MediaRecorder
- **Format:** 16kHz mono, WebM
- **Streaming:** Real-time chunks (100ms intervals)

### Platform

- **Hosting:** Sevalla (or any platform)
- **Connection:** Client-side WebSocket (bypasses hosting limitations)
- **Deployment:** Docker Compose for PostgreSQL, Next.js for frontend

---

## Implementation Considerations

### Performance

1. **Latency Optimization**
   - Use `sendRealtimeInput()` for fastest response
   - Pre-compute mesh embeddings
   - Cache frequent queries
   - Optimize pgvector queries with indexes

2. **Memory Management**
   - Limit command history to 50 items
   - Clean up unused audio chunks
   - Dispose of Three.js objects properly

3. **Network Efficiency**
   - Compress audio chunks before sending
   - Use connection pooling for database
   - Implement request debouncing

### Security

1. **API Keys**
   - Store in environment variables
   - Never expose in client-side code
   - Use server-side proxy for OpenRouter embeddings

2. **Microphone Access**
   - Request permission explicitly
   - Handle denial gracefully
   - Show permission status to user

3. **Input Validation**
   - Sanitize all user inputs
   - Validate intent types
   - Check mesh IDs before execution

### Accessibility

1. **Visual Feedback**
   - Clear status indicators (listening, processing, error)
   - Color-coded states (green=active, red=error, blue=transcript)
   - Text alternatives for audio states

2. **Keyboard Shortcuts**
   - Space: Toggle microphone
   - Escape: Stop listening
   - Ctrl+H: Show history
   - Ctrl+R: Retry last command

### Testing

1. **Unit Tests**
   - Intent classification accuracy
   - Mesh matching precision/recall
   - Action execution validation

2. **Integration Tests**
   - End-to-end voice command flow
   - WebSocket connection handling
   - Error recovery scenarios

3. **Performance Tests**
   - Latency measurement (< 1.5s)
   - Concurrent command handling
   - Memory usage monitoring

### Scalability

1. **Database**
   - pgvector indexes for fast similarity search
   - Connection pooling for high concurrency
   - Read replicas for scaling

2. **Client-Side**
   - Web Workers for audio processing
   - Service Worker for offline support
   - IndexedDB for persistent history

---

## Next Steps

1. **Implement Core Services**
   - VoiceCaptureService
   - GoogleLiveService
   - IntentClassifier
   - MeshMatcher
   - ActionController

2. **Integrate with Existing Code**
   - Extend Zustand store
   - Create API routes
   - Update model page

3. **Add UI Components**
   - Microphone button with status
   - Transcript display
   - Error messages
   - Feedback prompts

4. **Testing & Validation**
   - Unit tests for each service
   - Integration tests for flow
   - Performance validation (< 1.5s latency)

5. **Deployment**
   - Update environment variables
   - Deploy to Sevalla
   - Monitor performance

---

## Appendix

### A. Mesh Naming Convention

Meshes follow the pattern:
```
{hemisphere}.pial.DKT.{structure}.obj
```

Examples:
- `lh.pial.DKT.caudalanteriorcingulate.obj` - Left hemisphere, caudal anterior cingulate
- `rh.pial.DKT.superiorfrontal.obj` - Right hemisphere, superior frontal

### B. Intent Examples

| Voice Command | Intent | Parameters |
|--------------|---------|-------------|
| "Zoom in on the prefrontal cortex" | zoom | { level: 2.0 } |
| "Rotate the left hemisphere 45 degrees" | rotate | { degrees: 45, axis: 'y' } |
| "Highlight the superior frontal" | highlight | { color: '#ff0000' } |
| "Select the insula" | select | {} |
| "Show me the right cingulate" | select | {} |

### C. Error Codes

| Code | Description | Severity |
|------|-------------|-----------|
| MIC_001 | Microphone permission denied | High |
| MIC_002 | No microphone found | High |
| WS_001 | WebSocket connection failed | High |
| WS_002 | WebSocket disconnected | Medium |
| STT_001 | Speech-to-text timeout | Low |
| INT_001 | Intent not understood | Medium |
| MSH_001 | Mesh not found | Medium |
| ACT_001 | Action execution failed | High |

---

**Document Version:** 1.0
**Last Updated:** 2026-03-15
**Status:** Ready for Implementation
