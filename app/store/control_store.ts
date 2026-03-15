import { create } from "zustand";

type CutMesh = { uuid: string; name: string };

const initialState = { rotating: false, cutMeshes: [] as CutMesh[] };

// Voice command types
export type VoiceAction = 'zoom' | 'rotate' | 'highlight' | 'select' | 'query';

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
  addCutMesh: (mesh: CutMesh) => void;
  print: () => void;

  // Voice control state
  isListening: boolean;
  currentCommand: string;
  lastTranscript: string;
  error: string | null;
  lastAction: {
    type: VoiceAction;
    targetMeshId: string | null;
    parameters: Record<string, any>;
    timestamp: number;
  } | null;

  // Voice command history (memory only, last 50)
  commandHistory: VoiceCommand[];

  // Voice control actions
  setListening: (value: boolean) => void;
  setCurrentCommand: (command: string) => void;
  setLastTranscript: (transcript: string) => void;
  setError: (error: string | null) => void;
  setLastAction: (action: Control['lastAction']) => void;
  addCommandToHistory: (command: VoiceCommand) => void;
  clearHistory: () => void;
};

export const useControlStore = create<Control>((set, get) => ({
  ...initialState,

  // Existing controls
  setRotating: (value) => set({ rotating: value }),
  addCutMesh: (mesh) => {
    const existing = get().cutMeshes;
    if (existing.some((item) => item.uuid === mesh.uuid)) return;
    const next = [...existing, mesh];
    set({ cutMeshes: next });
    console.log(next);
  },
  print: () => {
    console.log("store");
  },

  // Voice control state
  isListening: false,
  currentCommand: '',
  lastTranscript: '',
  error: null,
  lastAction: null,
  commandHistory: [],

  // Voice control actions
  setListening: (value) => set({ isListening: value }),
  setCurrentCommand: (command) => set({ currentCommand: command }),
  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),
  setError: (error) => set({ error }),
  setLastAction: (action) => {
    console.log('[ControlStore] setLastAction called with:', action);
    set({ lastAction: action });
    console.log('[ControlStore] lastAction after set:', get().lastAction);
  },

  addCommandToHistory: (command) => set((state) => ({
    commandHistory: [command, ...state.commandHistory].slice(0, 50)
  })),

  clearHistory: () => set({ commandHistory: [] })
}));
