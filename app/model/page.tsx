"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.update();

    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

function Model() {
  const gltf = useLoader(GLTFLoader, "/model/model2.glb");
  const ref = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (!ref.current) return;

    const box = new THREE.Box3().setFromObject(ref.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.5 / maxDim;

    ref.current.scale.setScalar(scale);
    ref.current.position.sub(center.multiplyScalar(scale));
  }, [gltf]);

  return <primitive ref={ref} object={gltf.scene} />;
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

        <Controls />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
}
