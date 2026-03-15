import { VoiceAction } from '../store/control_store';

export interface Intent {
  action: VoiceAction;
  targetMesh: string;
  parameters: Record<string, any>;
  confidence: number;
}

export class IntentClassifier {
  async classify(transcription: string): Promise<Intent> {
    try {
      console.log('[IntentClassifier] Classifying transcription:', transcription);

      const response = await fetch('/api/voice/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const parsed = await response.json();
      console.log('[IntentClassifier] Parsed intent:', parsed);

      // Validate the response
      const validActions: VoiceAction[] = ['zoom', 'rotate', 'highlight', 'select'];
      if (!validActions.includes(parsed.action)) {
        throw new Error(`Invalid action type: ${parsed.action}`);
      }

      const intent: Intent = {
        action: parsed.action,
        targetMesh: parsed.targetMesh || 'scene',
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.5,
      };

      return intent;

    } catch (error) {
      console.error('[IntentClassifier] Error classifying intent:', error);

      // Return a fallback intent with low confidence
      return {
        action: 'select',
        targetMesh: transcription,
        parameters: {},
        confidence: 0.0,
      };
    }
  }
}
