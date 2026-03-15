import EventEmitter from 'eventemitter3';

export interface AudioChunk {
  data: Blob;
  timestamp: number;
}

export type VoiceCaptureEvents = {
  audioChunk: (chunk: AudioChunk) => void;
  transcription: (text: string) => void;
  error: (error: Error) => void;
};

// Buffer for collecting audio chunks during recording session
interface AudioBuffer {
  chunks: Blob[];
}

export class VoiceCaptureService extends EventEmitter<VoiceCaptureEvents> {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isCapturing = false;
  private useApiTranscription = true; // Use /api/voice/transcribe endpoint
  private audioBuffer: AudioBuffer | null = null; // Instance-level buffer
  private currentMimeType: string = '';

  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      console.warn('[VoiceCapture] Already capturing');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      console.log('[VoiceCapture] Audio stream obtained successfully');

      const mimeType = this.getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio MIME type found');
      }

      this.currentMimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 16000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.emit('audioChunk', { data: event.data, timestamp: Date.now() });
          
          // Accumulate all audio chunks during recording
          if (!this.audioBuffer) {
            this.audioBuffer = { chunks: [] };
          }
          this.audioBuffer.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(
          `MediaRecorder error: ${event instanceof Error ? event.message : 'Unknown error'}`
        );
        this.emit('error', error);
      };

      this.mediaRecorder.start(100);
      console.log('[VoiceCapture] MediaRecorder started');

      this.isCapturing = true;
      console.log('[VoiceCapture] Started capturing audio');
    } catch (error) {
      const captureError = error instanceof Error
        ? error
        : new Error('Failed to start audio capture');
      this.emit('error', captureError);
      throw captureError;
    }
  }

  async stopCapture(): Promise<void> {
    if (!this.isCapturing) return;

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        // Create a promise that resolves when the recorder actually stops
        const stopPromise = new Promise<void>((resolve) => {
          if (this.mediaRecorder) {
            this.mediaRecorder.onstop = () => resolve();
          } else {
            resolve();
          }
        });
        
        this.mediaRecorder.stop();
        await stopPromise;
      }

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }

      // Send complete audio buffer for transcription when recording stops
      if (this.audioBuffer && this.audioBuffer.chunks.length > 0 && this.useApiTranscription) {
        // Use a local reference to the buffer so we can clear instance state
        const bufferToSend = this.audioBuffer;
        this.audioBuffer = null;
        
        await this.sendBufferForTranscription(bufferToSend);
      }

      this.isCapturing = false;
      console.log('[VoiceCapture] Stopped capturing audio');
    } catch (error) {
      console.error('[VoiceCapture] Error stopping capture:', error);
      const captureError = error instanceof Error ? error : new Error('Unknown error stopping capture');
      this.emit('error', captureError);
      throw captureError;
    }
  }

  private async sendBufferForTranscription(buffer: AudioBuffer): Promise<void> {
    if (buffer.chunks.length === 0) {
      throw new Error('Cannot send empty audio buffer for transcription');
    }

    try {
      // Combine chunks into a single blob using the recorded MIME type
      const audioBlob = new Blob(buffer.chunks, { type: this.currentMimeType || 'audio/webm' });
      
      // Determine file extension based on MIME type
      let extension = 'webm';
      if (this.currentMimeType.includes('wav')) extension = 'wav';
      else if (this.currentMimeType.includes('ogg')) extension = 'ogg';
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, `audio.${extension}`);
      
      // Send to transcription endpoint
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VoiceCapture] Transcription failed:', errorText);
        throw new Error(`Transcription failed: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.text && result.text.trim()) {
        // Emit transcription event
        this.emit('transcription', result.text.trim());
      }
      
    } catch (error) {
      console.error('[VoiceCapture] Error sending buffer for transcription:', error);
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/wav',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return '';
  }

  getIsCapturing(): boolean {
    return this.isCapturing;
  }

  setUseApiTranscription(use: boolean): void {
    this.useApiTranscription = use;
  }
}
