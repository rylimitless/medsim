import { create } from 'zustand';
import { VoiceCaptureService } from '../services/voice-capture';
import { GoogleLiveService } from '../services/google-live';
import { IntentClassifier, Intent } from '../services/intent-classifier';
import { MeshMatch } from '../services/embedding-service';
import { ActionController } from '../services/action-controller';
import { TextToSpeechService } from '../services/text-to-speech';
import { VoiceCommand, VoiceAction } from './control_store';

export interface VoiceControlState {
  // Service instances
  voiceCapture: VoiceCaptureService | null;
  googleLive: GoogleLiveService | null;
  intentClassifier: IntentClassifier | null;
  actionController: ActionController | null;
  textToSpeech: TextToSpeechService | null;

  // Voice control state
  isListening: boolean;
  isSpeaking: boolean;
  currentCommand: string;
  lastTranscript: string;
  error: string | null;

  // Voice command history (memory only, last 50)
  commandHistory: VoiceCommand[];

  // Actions
  initializeVoiceControl: () => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  processTranscript: (transcript: string) => Promise<void>;
  setError: (error: string | null) => void;
  addCommandToHistory: (command: VoiceCommand) => void;
  clearHistory: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  cleanup: () => void;
}

export const useVoiceControlStore = create<VoiceControlState>((set, get) => ({
  // Service instances
  voiceCapture: null,
  googleLive: null,
  intentClassifier: null,
  actionController: null,
  textToSpeech: null,

  // Voice control state
  isListening: false,
  isSpeaking: false,
  currentCommand: '',
  lastTranscript: '',
  error: null,
  commandHistory: [],

  // Initialize voice control services
  initializeVoiceControl: async () => {
    console.log('[VoiceControlStore] Initializing voice control...');

    try {
      // Get API keys from environment
      const openRouterKey = process.env.OPENROUTER_API_KEY || '';
      const googleKey = process.env.GOOGLE_GENAI_API_KEY || '';

      // Create service instances
      const voiceCapture = new VoiceCaptureService();
      const googleLive = new GoogleLiveService(googleKey);
      const intentClassifier = new IntentClassifier();
      const actionController = new ActionController(get() as any);
      const textToSpeech = new TextToSpeechService();

      // Setup event listeners for voice capture
      voiceCapture.on('audioChunk', async (chunk) => {
        if (get().isListening && googleLive.getIsConnected()) {
          googleLive.sendAudio(chunk.data);
        }
      });

      voiceCapture.on('error', (error) => {
        console.error('[VoiceControlStore] Voice capture error:', error);
        get().setError(`Microphone error: ${error.message}`);
      });

      // Setup event listeners for Google Live
      googleLive.on('connected', () => {
        console.log('[VoiceControlStore] Google Live connected');
      });

      googleLive.on('disconnected', () => {
        console.log('[VoiceControlStore] Google Live disconnected');
        set({ isListening: false });
      });

      googleLive.on('error', (error) => {
        console.error('[VoiceControlStore] Google Live error:', error);
        get().setError(`Connection error: ${error.message}`);
      });

      googleLive.on('transcription', (text) => {
        console.log('[VoiceControlStore] Received transcription:', text);
        get().processTranscript(text);
      });

      // Connect to Google Live
      await googleLive.connect();

      // Store instances
      set({
        voiceCapture,
        googleLive,
        intentClassifier,
        actionController,
        textToSpeech,
        error: null,
      });

      console.log('[VoiceControlStore] Voice control initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[VoiceControlStore] Initialization error:', error);
      get().setError(`Failed to initialize voice control: ${errorMessage}`);
      throw error;
    }
  },

  // Start listening for voice commands
  startListening: async () => {
    const { voiceCapture, isListening } = get();

    if (!voiceCapture) {
      get().setError('Voice control not initialized. Call initializeVoiceControl first.');
      return;
    }

    if (isListening) {
      console.warn('[VoiceControlStore] Already listening');
      return;
    }

    try {
      await voiceCapture.startCapture();
      set({ isListening: true, error: null });
      console.log('[VoiceControlStore] Started listening');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[VoiceControlStore] Error starting listening:', error);
      get().setError(`Failed to start listening: ${errorMessage}`);
      throw error;
    }
  },

  // Stop listening for voice commands
  stopListening: () => {
    const { voiceCapture, isListening } = get();

    if (!voiceCapture || !isListening) {
      return;
    }

    voiceCapture.stopCapture();
    set({ isListening: false });
    console.log('[VoiceControlStore] Stopped listening');
  },

  // Process transcribed text
  processTranscript: async (transcript: string) => {
    const { intentClassifier, actionController } = get();

    if (!intentClassifier || !actionController) {
      console.error('[VoiceControlStore] Services not initialized');
      return;
    }

    try {
      console.log('[VoiceControlStore] Processing transcript:', transcript);

      // Update last transcript
      set({ lastTranscript: transcript });

      // Classify intent
      const intent = await intentClassifier.classify(transcript);
      console.log('[VoiceControlStore] Classified intent:', intent);

      // Find matching mesh via API
      const matchResponse = await fetch('/api/voice/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: intent.targetMesh }),
      });

      if (!matchResponse.ok) {
        throw new Error('Failed to match mesh');
      }

      const matchData = await matchResponse.json();
      const meshMatch = matchData.match;
      console.log('[VoiceControlStore] Mesh match:', meshMatch);

      // Create voice command record
      const command: VoiceCommand = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        userQuery: transcript,
        intentType: intent.action,
        targetMeshId: meshMatch?.meshId || null,
        actionParameters: intent.parameters,
        executionStatus: 'pending',
        errorMessage: null,
      };

      // Execute action
      try {
        if (meshMatch) {
          await actionController.executeIntent(intent, meshMatch);
          command.executionStatus = 'success';
        } else {
          command.executionStatus = 'failed';
          command.errorMessage = 'No matching mesh found';
          get().setError(`No matching mesh found for "${intent.targetMesh}"`);
        }
      } catch (error) {
        command.executionStatus = 'failed';
        command.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        get().setError(command.errorMessage);
      }

      // Add to history
      get().addCommandToHistory(command);

      // Speak response
      if (command.executionStatus === 'success') {
        const responseText = generateSuccessResponse(intent, meshMatch);
        get().speak(responseText);
      } else {
        get().speak(command.errorMessage || 'Sorry, I couldn\'t complete that command.');
      }

    } catch (error) {
      console.error('[VoiceControlStore] Error processing transcript:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      get().setError(errorMessage);
      get().speak(errorMessage);
    }
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Add command to history
  addCommandToHistory: (command: VoiceCommand) => {
    set((state) => ({
      commandHistory: [command, ...state.commandHistory].slice(0, 50),
    }));
  },

  // Clear command history
  clearHistory: () => {
    set({ commandHistory: [] });
  },

  // Helper function to generate success responses
  generateSuccessResponse(intent: Intent, meshMatch: MeshMatch | null): string {
    const action = intent.action;
    const meshName = meshMatch?.displayName || 'scene';

    const responses = {
      zoom: [
        `Zooming ${intent.parameters.level > 1 ? 'in' : 'out'} on ${meshName}.`,
        `Adjusting zoom level for ${meshName}.`,
      ],
      rotate: [
        `Rotating ${meshName} by ${intent.parameters.degrees || 45} degrees.`,
        `Turning ${meshName} on the ${intent.parameters.axis || 'y'} axis.`,
      ],
      highlight: [
        `Highlighting ${meshName}.`,
        `I've highlighted ${meshName} for you.`,
      ],
      select: [
        `Selecting ${meshName}.`,
        `Focusing on ${meshName}.`,
      ],
    };

    const actionResponses = responses[action] || responses.select;
    return actionResponses[Math.floor(Math.random() * actionResponses.length)];
  },

  // Speak text using TTS
  speak: (text: string) => {
    const { textToSpeech } = get();
    if (!textToSpeech) {
      console.warn('[VoiceControlStore] TTS service not initialized');
      return;
    }

    set({ isSpeaking: true });
    textToSpeech.speak(text, {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });

    // Reset isSpeaking after a reasonable time
    setTimeout(() => {
      set({ isSpeaking: false });
    }, text.length * 100 + 1000);
  },

  // Stop speaking
  stopSpeaking: () => {
    const { textToSpeech } = get();
    if (textToSpeech) {
      textToSpeech.stop();
      set({ isSpeaking: false });
    }
  },

  // Cleanup resources
  cleanup: () => {
    const { voiceCapture, googleLive, textToSpeech } = get();

    if (voiceCapture) {
      voiceCapture.stopCapture();
    }

    if (googleLive) {
      googleLive.disconnect();
    }

    if (textToSpeech) {
      textToSpeech.stop();
    }

    set({
      voiceCapture: null,
      googleLive: null,
      intentClassifier: null,
      actionController: null,
      textToSpeech: null,
      isListening: false,
      isSpeaking: false,
    });

    console.log('[VoiceControlStore] Cleaned up');
  },
}));

// Helper function outside store
function generateSuccessResponse(intent: Intent, meshMatch: MeshMatch | null): string {
  const action = intent.action;
  const meshName = meshMatch?.displayName || 'scene';

  const responses = {
    zoom: [
      `Zooming ${intent.parameters.level > 1 ? 'in' : 'out'} on ${meshName}.`,
      `Adjusting zoom level for ${meshName}.`,
    ],
    rotate: [
      `Rotating ${meshName} by ${intent.parameters.degrees || 45} degrees.`,
      `Turning ${meshName} on the ${intent.parameters.axis || 'y'} axis.`,
    ],
    highlight: [
      `Highlighting ${meshName}.`,
      `I've highlighted ${meshName} for you.`,
    ],
    select: [
      `Selecting ${meshName}.`,
      `Focusing on ${meshName}.`,
    ],
  };

  const actionResponses = responses[action] || responses.select;
  return actionResponses[Math.floor(Math.random() * actionResponses.length)];
}
