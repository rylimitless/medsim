import { Intent } from "./intent-classifier";
import type { MeshMatch } from "./embedding-service";
import { useControlStore, VoiceAction } from "../store/control_store";

export class ActionController {
  constructor(private store: ReturnType<typeof useControlStore.getState>) {}

  async executeIntent(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    try {
      console.log(
        "[ActionController] Executing intent:",
        intent,
        "with mesh match:",
        meshMatch,
      );

      switch (intent.action) {
        case "zoom":
          await this.executeZoom(intent, meshMatch);
          break;
        case "rotate":
          await this.executeRotate(intent, meshMatch);
          break;
        case "highlight":
          await this.executeHighlight(intent, meshMatch);
          break;
        case "select":
          await this.executeSelect(intent, meshMatch);
          break;
        case "query":
          await this.executeQuery(intent, meshMatch);
          break;
        default:
          throw new Error(`Unknown action type: ${intent.action}`);
      }

      console.log("[ActionController] Intent executed successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[ActionController] Error executing intent:", error);
      this.store.setError(errorMessage);
      throw error;
    }
  }

  private async executeZoom(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    const level = intent.parameters.level || 1.5;
    const targetMeshId = meshMatch?.meshId || null;

    console.log(
      "[ActionController] Zoom - level:",
      level,
      "target:",
      targetMeshId,
    );

    // Update store with zoom action
    this.store.setCurrentCommand(
      `Zoom ${level > 1 ? "in" : "out"}${meshMatch ? ` on ${meshMatch.displayName}` : ""}`,
    );
    this.store.setError(null);

    // Set the executable action for the 3D scene
    this.store.setLastAction({
      type: "zoom",
      targetMeshId,
      parameters: { level },
      timestamp: Date.now(),
    });
  }

  private async executeRotate(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    const degrees = intent.parameters.degrees || 45;
    const axis = intent.parameters.axis || "y";
    const targetMeshId = meshMatch?.meshId || null;

    console.log(
      "[ActionController] Rotate - degrees:",
      degrees,
      "axis:",
      axis,
      "target:",
      targetMeshId,
    );

    // Update store with rotate action
    this.store.setCurrentCommand(
      `Rotate ${degrees}° on ${axis}-axis${meshMatch ? ` for ${meshMatch.displayName}` : ""}`,
    );
    this.store.setError(null);

    // Set the executable action for the 3D scene
    this.store.setLastAction({
      type: "rotate",
      targetMeshId,
      parameters: { degrees, axis },
      timestamp: Date.now(),
    });
  }

  private async executeHighlight(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    const color = intent.parameters.color || "#ff0000";
    const targetMeshId = meshMatch?.meshId || null;

    console.log(
      "[ActionController] Highlight - color:",
      color,
      "target:",
      targetMeshId,
    );

    if (!meshMatch) {
      console.warn("[ActionController] Cannot highlight: no mesh specified");
      this.store.setError("Could not find the specified anatomical structure.");
      return;
    }

    // Update store with highlight action
    this.store.setCurrentCommand(
      `Highlight ${meshMatch.displayName} in ${color}`,
    );
    this.store.setError(null);

    // Set the executable action for the 3D scene
    this.store.setLastAction({
      type: "highlight",
      targetMeshId,
      parameters: { color },
      timestamp: Date.now(),
    });
  }

  private async executeSelect(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    if (!meshMatch) {
      console.warn(
        "[ActionController] Cannot select: no mesh specified, falling back to intent target",
      );
    }

    const targetMeshId = meshMatch?.meshId || null;
    const targetMeshName = meshMatch?.meshName || intent.targetMesh;
    const displayName = meshMatch?.displayName || intent.targetMesh;

    console.log(
      "[ActionController] Select - target:",
      targetMeshId,
      "meshName:",
      targetMeshName,
    );

    // Update store with select action
    this.store.setCurrentCommand(`Select ${displayName}`);
    this.store.setError(null);

    const action = {
      type: "select" as const,
      targetMeshId,
      parameters: { targetMeshName },
      timestamp: Date.now(),
    };

    console.log("[ActionController] Setting lastAction:", action);
    this.store.setLastAction(action);
    console.log("[ActionController] lastAction set successfully");
  }

  private async executeQuery(
    intent: Intent,
    meshMatch: MeshMatch | null,
  ): Promise<void> {
    const targetMeshId = meshMatch?.meshId || null;

    console.log("[ActionController] Query - target:", targetMeshId);

    // Update store with query action
    this.store.setCurrentCommand(`Query: ${intent.targetMesh}`);
    this.store.setError(null);

    // Set the executable action for the 3D scene
    this.store.setLastAction({
      type: "query",
      targetMeshId,
      parameters: { response: intent.response },
      timestamp: Date.now(),
    });
  }
}
