import { Intent } from './intent-classifier';
import { MeshMatch } from './embedding-service';
import { useControlStore, VoiceAction } from '../store/control_store';

export class ActionController {
  constructor(private store: ReturnType<typeof useControlStore.getState>) {}

  async executeIntent(intent: Intent, meshMatch: MeshMatch | null): Promise<void> {
    try {
      console.log('[ActionController] Executing intent:', intent, 'with mesh match:', meshMatch);

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
        default:
          throw new Error(`Unknown action type: ${intent.action}`);
      }

      console.log('[ActionController] Intent executed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ActionController] Error executing intent:', error);
      this.store.setError(errorMessage);
      throw error;
    }
  }

  private async executeZoom(intent: Intent, meshMatch: MeshMatch | null): Promise<void> {
    const level = intent.parameters.level || 1.5;
    const targetMeshId = meshMatch?.meshId || null;

    console.log('[ActionController] Zoom - level:', level, 'target:', targetMeshId);

    // Update store with zoom action
    this.store.setCurrentCommand(`Zoom ${level > 1 ? 'in' : 'out'}${meshMatch ? ` on ${meshMatch.displayName}` : ''}`);
    this.store.setError(null);

    // Note: The actual zoom implementation would interact with the Three.js scene
    // For now, we're just updating the store state
  }

  private async executeRotate(intent: Intent, meshMatch: MeshMatch | null): Promise<void> {
    const degrees = intent.parameters.degrees || 45;
    const axis = intent.parameters.axis || 'y';
    const targetMeshId = meshMatch?.meshId || null;

    console.log('[ActionController] Rotate - degrees:', degrees, 'axis:', axis, 'target:', targetMeshId);

    // Update store with rotate action
    this.store.setCurrentCommand(`Rotate ${degrees}° on ${axis}-axis${meshMatch ? ` for ${meshMatch.displayName}` : ''}`);
    this.store.setError(null);

    // Note: The actual rotation implementation would interact with the Three.js scene
    // For now, we're just updating the store state
  }

  private async executeHighlight(intent: Intent, meshMatch: MeshMatch | null): Promise<void> {
    const color = intent.parameters.color || '#ff0000';
    const targetMeshId = meshMatch?.meshId || null;

    console.log('[ActionController] Highlight - color:', color, 'target:', targetMeshId);

    if (!meshMatch) {
      throw new Error('Cannot highlight: no mesh specified');
    }

    // Update store with highlight action
    this.store.setCurrentCommand(`Highlight ${meshMatch.displayName} in ${color}`);
    this.store.setError(null);

    // Note: The actual highlight implementation would interact with the Three.js scene
    // For now, we're just updating the store state
  }

  private async executeSelect(intent: Intent, meshMatch: MeshMatch | null): Promise<void> {
    if (!meshMatch) {
      throw new Error('Cannot select: no mesh specified');
    }

    console.log('[ActionController] Select - target:', meshMatch.meshId);

    // Update store with select action
    this.store.setCurrentCommand(`Select ${meshMatch.displayName}`);
    this.store.setError(null);

    // Note: The actual select implementation would interact with the Three.js scene
    // For now, we're just updating the store state
  }
}
