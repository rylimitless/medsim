"use client";

import React, { Suspense, useEffect, useRef, useCallback } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ThreeEvent } from "@react-three/fiber";

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

export default function ModelPage() {
  return (
    <div className="h-screen w-screen bg-black">
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
    </div>
  );
}
