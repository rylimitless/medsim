"use client";

import React, { Suspense, useEffect, useRef, useCallback, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ThreeEvent } from "@react-three/fiber";
import { useVoiceControlStore } from "../store/voice-control-store";
import { useControlStore } from "../store/control_store";

function useRotationControls(
  targetRef: React.RefObject<THREE.Object3D | null>,
) {
  const applyRotation = useCallback(
    (dx: number, dy: number) => {
      const target = targetRef.current;
      if (!target) return;

      target.rotation.y += dx * 0.01;
      target.rotation.x += dy * 0.01;

      target.rotation.x = THREE.MathUtils.clamp(
        target.rotation.x,
        -Math.PI / 2,
        Math.PI / 2,
      );
    },
    [targetRef],
  );

  return { applyRotation };
}

function Model() {
  const gltf = useLoader(GLTFLoader, "/model/model2.glb");
  const groupRef = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const { applyRotation } = useRotationControls(groupRef);

  useEffect(() => {
    if (!gltf.scene) return;

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.5 / maxDim;

    gltf.scene.scale.setScalar(scale);
    gltf.scene.position.sub(center.multiplyScalar(scale));
  }, [gltf]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;

    applyRotation(dx, dy);

    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function VoiceControlPanel() {
  const {
    isListening,
    isSpeaking,
    lastTranscript,
    currentCommand,
    error,
    commandHistory,
    initializeVoiceControl,
    startListening,
    stopListening,
    stopSpeaking,
    clearHistory,
  } = useVoiceControlStore();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize voice control on mount
    initializeVoiceControl()
      .then(() => setIsInitialized(true))
      .catch((err) => console.error("Failed to initialize voice control:", err));
  }, [initializeVoiceControl]);

  const handleToggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  if (!isInitialized) {
    return (
      <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          Initializing voice control...
        </span>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-80 space-y-2">
      {/* Voice Status Indicator */}
      <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Voice Control</span>
          <div className="flex gap-2">
            <button
              onClick={handleToggleListening}
              disabled={isSpeaking}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } ${isSpeaking ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isListening ? "Stop" : "Start"}
            </button>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 rounded-md text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700"
              >
                Mute
              </button>
            )}
          </div>
        </div>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Listening...
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Speaking...
          </div>
        )}

        {lastTranscript && (
          <div className="mt-2 text-sm text-blue-300">
            <span className="text-gray-400">Heard:</span> "{lastTranscript}"
          </div>
        )}

        {currentCommand && (
          <div className="mt-2 text-sm text-green-300">
            <span className="text-gray-400">Action:</span> {currentCommand}
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-400 bg-red-900/20 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Command History</span>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commandHistory.slice(0, 5).map((command) => (
              <div
                key={command.id}
                className={`text-xs p-2 rounded ${
                  command.executionStatus === "success"
                    ? "bg-green-900/20 border border-green-700/30"
                    : "bg-red-900/20 border border-red-700/30"
                }`}
              >
                <div className="font-medium text-gray-300">
                  "{command.userQuery}"
                </div>
                <div className="text-gray-400 mt-1">
                  {command.intentType} → {command.executionStatus}
                </div>
                {command.errorMessage && (
                  <div className="text-red-400 mt-1">{command.errorMessage}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
        <div className="font-semibold mb-1">Voice Commands</div>
        <div className="text-gray-400 text-xs space-y-1">
          <div>• "Zoom in on the prefrontal cortex"</div>
          <div>• "Rotate the left hemisphere 45 degrees"</div>
          <div>• "Highlight the insula"</div>
          <div>• "Select the superior frontal"</div>
        </div>
      </div>
    </div>
  );
}

export default function ModelPage() {
  return (
    <div className="h-screen w-screen bg-black relative">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#2b2b2b"]} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#bdbdbd", 0.8]} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />

        <Suspense fallback={null}>
          <Model />
        </Suspense>
      </Canvas>

      <VoiceControlPanel />
    </div>
  );
}
