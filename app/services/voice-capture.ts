import EventEmitter from 'eventemitter3';

export interface AudioChunk {
  data: Blob;
  timestamp: number;
}

export type VoiceCaptureEvents = {
  audioChunk: (chunk: AudioChunk) => void;
  error: (error: Error) => void;
};

export class VoiceCaptureService extends EventEmitter<VoiceCaptureEvents> {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isCapturing = false;

  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      console.warn('[VoiceCapture] Already capturing');
      return;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Check for supported MIME types
      const mimeType = this.getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio MIME type found');
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 16000,
      });

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.emit('audioChunk', {
            data: event.data,
            timestamp: Date.now(),
          });
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        const error = new Error(
          `MediaRecorder error: ${event instanceof Error ? event.message : 'Unknown error'}`
        );
        this.emit('error', error);
      };

      // Start recording with 100ms intervals
      this.mediaRecorder.start(100);
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

  stopCapture(): void {
    if (!this.isCapturing) {
      return;
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }

      this.isCapturing = false;
      console.log('[VoiceCapture] Stopped capturing audio');
    } catch (error) {
      console.error('[VoiceCapture] Error stopping capture:', error);
    }
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
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
}
