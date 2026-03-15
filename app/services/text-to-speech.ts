import EventEmitter from 'eventemitter3';

export type TTSEvents = {
  voicesChanged: (voices: SpeechSynthesisVoice[]) => void;
};

export class TextToSpeechService extends EventEmitter<TTSEvents> {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;

  constructor() {
    super();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Reload voices when they become available (browser quirk)
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
    console.log('[TTS] Loaded voices:', this.voices.length);
    this.emit('voicesChanged', this.voices);
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(text: string, options: { rate?: number; pitch?: number; volume?: number; voiceName?: string } = {}): void {
    if (!this.synthesis) {
      console.warn('[TTS] Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    // Try to find a good voice
    let preferredVoice = this.voices[0];
    if (options.voiceName) {
      preferredVoice = this.voices.find(v => v.name === options.voiceName) || preferredVoice;
    } else {
      preferredVoice = this.voices.find(voice => voice.lang.startsWith('en')) || preferredVoice;
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('[TTS] Started speaking:', text);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      console.log('[TTS] Finished speaking');
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error('[TTS] Error:', event);
    };

    this.synthesis.speak(utterance);
  }

  stop(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      console.log('[TTS] Stopped speaking');
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  isSupported(): boolean {
    return this.synthesis !== null;
  }
}
