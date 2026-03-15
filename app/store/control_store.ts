import { create } from "zustand";

const initialState = { rotating: false };

// Voice command types
export type VoiceAction = 'zoom' | 'rotate' | 'highlight' | 'select';

export interface VoiceCommand {
  id: string;
  timestamp: number;
  userQuery: string;
  intentType: string;
  targetMeshId: string | null;
  actionParameters: Record<string, any>;
  executionStatus: 'pending' | 'success' | 'failed';
  errorMessage: string | null;
  feedback?: {
    type: 'wrong_action' | 'wrong_mesh' | 'other';
    timestamp: number;
  };
}

type Control = typeof initialState & {
  // Existing controls
  setRotating: (value: boolean) => void;
  print: () => void;

  // Voice control state
  isListening: boolean;
  currentCommand: string;
  lastTranscript: string;
  error: string | null;

  // Voice command history (memory only, last 50)
  commandHistory: VoiceCommand[];

  // Voice control actions
  setListening: (value: boolean) => void;
  setCurrentCommand: (command: string) => void;
  setLastTranscript: (transcript: string) => void;
  setError: (error: string | null) => void;
  addCommandToHistory: (command: VoiceCommand) => void;
  clearHistory: () => void;
};

export const useControlStore = create<Control>((set, get) => ({
  ...initialState,

  // Existing controls
  setRotating: (value) => set({ rotating: value }),
  print: () => {
    console.log("store");
  },

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
