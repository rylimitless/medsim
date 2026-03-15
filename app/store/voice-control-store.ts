import { create } from 'zustand';
import { VoiceCaptureService } from '../services/voice-capture';
import { IntentClassifier, Intent } from '../services/intent-classifier';
import type { MeshMatch } from '../services/embedding-service';
import { ActionController } from '../services/action-controller';
import { TextToSpeechService } from '../services/text-to-speech';
import { VoiceCommand, VoiceAction, useControlStore } from './control_store';

export interface VoiceControlState {
  // Service instances
  voiceCapture: VoiceCaptureService | null;
  intentClassifier: IntentClassifier | null;
  actionController: ActionController | null;
  textToSpeech: TextToSpeechService | null;

  // Voice control state
  isListening: boolean;
  isSpeaking: boolean;
  isConnected: boolean; // For UI feedback
  isProcessing: boolean;
  currentCommand: string;
  lastTranscript: string;
  lastResponse: string;
  lastActionTaken: string;
  selectedVoice: string | null;
  availableVoices: string[];
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
  setSelectedVoice: (voiceName: string) => void;
  stopSpeaking: () => void;
  cleanup: () => void;
}

export const useVoiceControlStore = create<VoiceControlState>((set, get) => ({
  // Service instances
  voiceCapture: null,
  intentClassifier: null,
  actionController: null,
  textToSpeech: null,

  // Voice control state
  isListening: false,
  isSpeaking: false,
  isConnected: false,
  isProcessing: false,
  currentCommand: '',
  lastTranscript: '',
  lastResponse: '',
  lastActionTaken: '',
  selectedVoice: null,
  availableVoices: [],
  error: null,
  commandHistory: [],

  // Initialize voice control services
  initializeVoiceControl: async () => {
    console.log('[VoiceControlStore] Initializing voice control...');

    try {
      // Create service instances
      const voiceCapture = new VoiceCaptureService();
      const intentClassifier = new IntentClassifier();
      const actionController = new ActionController(useControlStore.getState());
      const textToSpeech = new TextToSpeechService();

      // Setup event listeners for voice capture
      voiceCapture.on('audioChunk', async (chunk) => {
        // Audio chunks are handled internally by VoiceCaptureService
        // which sends them to the transcription API
      });

      // API-based transcription → drives the full classify pipeline
      voiceCapture.on('transcription', (text) => {
        // Process transcription even if isListening is false,
        // as the result often arrives after stopCapture() is called.
        console.log('[VoiceControlStore] Transcription received:', text);
        get().processTranscript(text);
      });

      voiceCapture.on('error', (error) => {
        console.error('[VoiceControlStore] Voice capture error:', error);
        get().setError(`Microphone error: ${error.message}`);
      });

      // Setup event listeners for TTS
      textToSpeech.on('voicesChanged', (voices) => {
        set({ availableVoices: voices.map(v => v.name) });
      });

      // Store instances
      set({
        voiceCapture,
        intentClassifier,
        actionController,
        textToSpeech,
        isConnected: true, // Mark as connected once initialized
        availableVoices: textToSpeech.getVoices().map(v => v.name),
        error: null,
      });

      // Listen for manual commands from the monitor
      const handleManualCommand = (e: Event) => {
        const ev = e as CustomEvent;
        const transcript = ev.detail.transcript;
        if (transcript) {
          console.log('[VoiceControlStore] Manual command received:', transcript);
          
          // Also dispatch a transcription event so it shows up in the monitor's Transcript tab
          window.dispatchEvent(new CustomEvent('voice-control:transcription', {
            detail: { transcript, source: 'manual' }
          }));
          
          get().processTranscript(transcript);
        }
      };
      
      // Remove existing listener if any (to prevent multiple listeners on double initialization)
      const win = window as Window & { _voiceManualHandler?: EventListener };
      
      // Clean up both old and new event names to prevent duplicates during development
      if (win._voiceManualHandler) {
        window.removeEventListener('voice-control:manual-command', win._voiceManualHandler);
        window.removeEventListener('voice-control:transcription', win._voiceManualHandler);
      }
      
      win._voiceManualHandler = handleManualCommand as EventListener;
      window.addEventListener('voice-control:manual-command', handleManualCommand);

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
      console.log('[VoiceControlStore] Already listening');
      return;
    }

    try {
      console.log('[VoiceControlStore] Starting voice capture...');
      await voiceCapture.startCapture();
      set({ isListening: true, error: null });
      console.log('[VoiceControlStore] Voice capture started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[VoiceControlStore] Failed to start listening:', error);
      get().setError(`Failed to start listening: ${errorMessage}`);
    }
  },

  // Stop listening for voice commands
  stopListening: () => {
    const { voiceCapture, isListening } = get();

    if (!voiceCapture || !isListening) {
      return;
    }

    console.log('[VoiceControlStore] Stopping voice capture...');
    voiceCapture.stopCapture();
    set({ isListening: false });
    console.log('[VoiceControlStore] Voice capture stopped');
  },

  // Process a transcript through the classification pipeline
  processTranscript: async (transcript: string) => {
    console.log('[VoiceControlStore] Processing transcript:', transcript);

    const { intentClassifier, actionController } = get();

    if (!intentClassifier || !actionController) {
      console.error('[VoiceControlStore] Services not initialized');
      get().setError('Voice control services not initialized');
      return;
    }

    try {
      // Set processing state
      set({ isProcessing: true });
      // Update last transcript
      set({ lastTranscript: transcript, currentCommand: transcript });

      // Classify intent
      console.log('[VoiceControlStore] Classifying intent...');
      const intent: Intent = await intentClassifier.classify(transcript);
      console.log('[VoiceControlStore] Intent classified:', intent);

      if (intent.confidence < 0.5) {
        console.log('[VoiceControlStore] Low confidence, skipping');
        get().speak("I didn't understand that. Please try again.");
        return;
      }

      // Find matching mesh via API
      console.log('[VoiceControlStore] Finding matching mesh via API...');
      const matchResponse = await fetch('/api/voice/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: intent.targetMesh }),
      });
      
      let meshMatch: MeshMatch | null = null;
      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        meshMatch = matchData.match;
      }
      console.log('[VoiceControlStore] Mesh match:', meshMatch);

      // Dispatch event for monitor
      window.dispatchEvent(new CustomEvent('voice-control:mesh-match', {
        detail: { meshMatch }
      }));

      // Execute action
      console.log('[VoiceControlStore] Executing action...', intent, meshMatch);
      await actionController.executeIntent(intent, meshMatch);
      console.log('[VoiceControlStore] Action executed, lastAction:', useControlStore.getState().lastAction);

      // Dispatch event for monitor
      window.dispatchEvent(new CustomEvent('voice-control:action', {
        detail: { action: intent.action, status: 'success' }
      }));

      // Add to history
      const command: VoiceCommand = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        userQuery: transcript,
        intentType: intent.action,
        targetMeshId: meshMatch?.meshId || intent.targetMesh,
        actionParameters: intent.parameters,
        executionStatus: 'success',
        errorMessage: null,
      };

      get().addCommandToHistory(command);

      // Generate success response
      const response = generateSuccessResponse(intent, meshMatch);
      get().speak(response);

      // Generate action description for display
      const actionDescription = generateActionDescription(intent, meshMatch);
      
      set({ currentCommand: '', error: null, lastResponse: response, lastActionTaken: actionDescription, isProcessing: false });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[VoiceControlStore] Error processing transcript:', error);
      get().setError(`Error processing command: ${errorMessage}`);
      get().speak("Sorry, something went wrong.");
      set({ isProcessing: false });
    }
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Add command to history
  addCommandToHistory: (command: VoiceCommand) => {
    const { commandHistory } = get();
    const updatedHistory = [command, ...commandHistory].slice(0, 50);
    set({ commandHistory: updatedHistory });
  },

  // Clear command history
  clearHistory: () => {
    set({
      commandHistory: [],
      lastTranscript: '',
      lastResponse: '',
      lastActionTaken: '',
      error: null
    });
  },

  // Speak text using TTS
  speak: (text: string) => {
    const { textToSpeech, selectedVoice } = get();

    if (!textToSpeech) {
      console.warn('[VoiceControlStore] TTS not initialized');
      return;
    }

    console.log('[VoiceControlStore] Speaking:', text);
    textToSpeech.speak(text, { voiceName: selectedVoice || undefined });
    set({ isSpeaking: true });

    // Reset isSpeaking after a reasonable time
    setTimeout(() => {
      set({ isSpeaking: false });
    }, 3000);
  },

  // Set selected voice
  setSelectedVoice: (voiceName: string) => {
    set({ selectedVoice: voiceName });
  },

  // Stop speaking
  stopSpeaking: () => {
    const { textToSpeech } = get();

    if (!textToSpeech) {
      return;
    }

    console.log('[VoiceControlStore] Stopping speech...');
    textToSpeech.stop();
    set({ isSpeaking: false });
  },

  // Cleanup resources
  cleanup: () => {
    const { voiceCapture, textToSpeech } = get();

    console.log('[VoiceControlStore] Cleaning up...');

    if (voiceCapture) {
      voiceCapture.stopCapture();
    }

    if (textToSpeech) {
      textToSpeech.stop();
    }

    set({
      voiceCapture: null,
      intentClassifier: null,
      actionController: null,
      textToSpeech: null,
      isListening: false,
      isSpeaking: false,
      isConnected: false,
      isProcessing: false,
      currentCommand: '',
      lastTranscript: '',
      lastResponse: '',
      lastActionTaken: '',
      error: null,
    });

    console.log('[VoiceControlStore] Cleanup complete');
  },
}));

// Helper function to generate success response
function generateSuccessResponse(intent: Intent, meshMatch: MeshMatch | null): string {
  const meshName = meshMatch?.displayName || intent.targetMesh;
  const hasMatch = !!meshMatch;

  // Actions that strictly require a mesh match
  if (!hasMatch && (intent.action === 'highlight' || intent.action === 'select')) {
    return `I couldn't find the anatomical structure "${intent.targetMesh}" to ${intent.action}.`;
  }

  switch (intent.action) {
    case 'zoom':
      { const level = intent.parameters.level;
      if (level > 1) {
        return `Zoomed in ${level}x on ${meshName}`;
      } else if (level < 1) {
        return `Zoomed out on ${meshName}`;
      }
      return `Zoomed in on ${meshName}`; }

    case 'rotate':
      { const degrees = intent.parameters.degrees;
      const axis = intent.parameters.axis || 'y';
      if (degrees) {
        return `Rotated ${degrees} degrees around the ${axis} axis`;
      }
      return `Rotated ${meshName}`; }

    case 'highlight':
      { const color = intent.parameters.color;
      if (color) {
        return `Highlighted ${meshName} in ${color}`;
      }
      return `Highlighted ${meshName}`; }

    case 'select':
      return `Selected ${meshName}`;

    case 'query':
      return intent.response || `I found information about ${meshName}`;

    default:
      return `Executed ${intent.action} on ${meshName}`;
  }
}

// Helper function to generate action description for display
function generateActionDescription(intent: Intent, meshMatch: MeshMatch | null): string {
  const hasMatch = !!meshMatch;

  if (!hasMatch && (intent.action === 'highlight' || intent.action === 'select')) {
    return 'Failed';
  }

  switch (intent.action) {
    case 'zoom':
      return 'Zoom';

    case 'rotate':
      return 'Rotate';

    case 'highlight':
      return 'Highlight';

    case 'select':
      return 'Select';

    case 'query':
      return 'Query';

    default:
      const action = intent.action as string;
      return action.charAt(0).toUpperCase() + action.slice(1);
  }
}
