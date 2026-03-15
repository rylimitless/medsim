"use client";

import React, { Suspense, useEffect, useRef, useCallback } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ThreeEvent } from "@react-three/fiber";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

const LANDMARK_COUNT = 21;

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

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

function Model({
  modelRef,
}: {
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  const gltf = useLoader(GLTFLoader, "/model/model2.glb");
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const { applyRotation } = useRotationControls(modelRef);

  useEffect(() => {
    if (!gltf.scene) return;

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.0 / maxDim;

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
      ref={modelRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function HandMesh({
  handIndex,
  landmarksRef,
  modelRef,
  mirror = true,
  depthScale = 0.8,
  minZ = 0.15,
  maxZ = 1.2,
  collisionOffset = 0.02,
  pointRadius = 0.03,
  connectionRadius = 0.008,
  pointColor = "#ff3b3b",
  lineColor = "#30ff54",
}: {
  handIndex: number;
  landmarksRef: React.MutableRefObject<NormalizedLandmark[][]>;
  modelRef: React.RefObject<THREE.Group | null>;
  mirror?: boolean;
  depthScale?: number;
  minZ?: number;
  maxZ?: number;
  collisionOffset?: number;
  pointRadius?: number;
  connectionRadius?: number;
  pointColor?: string;
  lineColor?: string;
}) {
  const pointsRef = useRef<THREE.InstancedMesh>(null);
  const connectionsRef = useRef<THREE.InstancedMesh>(null);

  const worldPositionsRef = useRef(
    Array.from({ length: LANDMARK_COUNT }, () => new THREE.Vector3()),
  );
  const dummyRef = useRef(new THREE.Object3D());
  const connectionDummyRef = useRef(new THREE.Object3D());
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const upRef = useRef(new THREE.Vector3(0, 1, 0));
  const tempDirRef = useRef(new THREE.Vector3());
  const tempMidRef = useRef(new THREE.Vector3());
  const tempQuatRef = useRef(new THREE.Quaternion());
  const tempScaleRef = useRef(new THREE.Vector3());
  const modelBoxRef = useRef(new THREE.Box3());
  const hitRef = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    const landmarks = landmarksRef.current[handIndex];
    const pointsMesh = pointsRef.current;
    const connectionsMesh = connectionsRef.current;
    const worldPositions = worldPositionsRef.current;
    const dummy = dummyRef.current;
    const connectionDummy = connectionDummyRef.current;
    const raycaster = raycasterRef.current;
    const ndc = ndcRef.current;
    const plane = planeRef.current;
    const up = upRef.current;
    const tempDir = tempDirRef.current;
    const tempMid = tempMidRef.current;
    const tempQuat = tempQuatRef.current;
    const tempScale = tempScaleRef.current;
    const model = modelRef.current;
    const modelBox = modelBoxRef.current;
    const hitPoint = hitRef.current;

    const hasModel = Boolean(model);
    if (hasModel) {
      modelBox.setFromObject(model as THREE.Object3D);
    }

    if (!pointsMesh || !connectionsMesh) return;

    if (!landmarks || landmarks.length === 0) {
      pointsMesh.visible = false;
      connectionsMesh.visible = false;
      return;
    }

    pointsMesh.visible = true;
    connectionsMesh.visible = true;

    for (let i = 0; i < LANDMARK_COUNT; i += 1) {
      const lm = landmarks[i];
      const out = worldPositions[i];

      if (!lm) {
        out.set(0, 0, 0);
        continue;
      }

      const nx = mirror ? 1 - lm.x : lm.x;
      const ny = lm.y;

      const ndcX = nx * 2 - 1;
      const ndcY = (1 - ny) * 2 - 1;

      ndc.set(ndcX, ndcY);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(plane, out);

      if (!hit) {
        out.set(0, 0, 0);
        continue;
      }

      const depth = lm.z ?? 0;
      out.z += -depth * depthScale;
      out.z = THREE.MathUtils.clamp(out.z, minZ, maxZ);

      if (hasModel) {
        const hit = raycaster.ray.intersectBox(modelBox, hitPoint);
        if (hit) {
          const outDist = camera.position.distanceTo(out);
          const hitDist = camera.position.distanceTo(hit);
          if (outDist > hitDist) {
            out
              .copy(hit)
              .addScaledVector(raycaster.ray.direction, -collisionOffset);
          }
        }
      }
    }

    for (let i = 0; i < LANDMARK_COUNT; i += 1) {
      dummy.position.copy(worldPositions[i]);
      dummy.updateMatrix();
      pointsMesh.setMatrixAt(i, dummy.matrix);
    }
    pointsMesh.instanceMatrix.needsUpdate = true;

    let connectionIndex = 0;
    for (const [a, b] of HAND_CONNECTIONS) {
      const va = worldPositions[a];
      const vb = worldPositions[b];

      tempMid.copy(va).add(vb).multiplyScalar(0.5);
      tempDir.copy(vb).sub(va);
      const length = tempDir.length();

      if (length === 0) {
        connectionDummy.position.copy(tempMid);
        connectionDummy.quaternion.identity();
        connectionDummy.scale.set(0, 0, 0);
      } else {
        tempDir.normalize();
        tempQuat.setFromUnitVectors(up, tempDir);
        connectionDummy.position.copy(tempMid);
        connectionDummy.quaternion.copy(tempQuat);
        tempScale.set(connectionRadius, length, connectionRadius);
        connectionDummy.scale.copy(tempScale);
      }

      connectionDummy.updateMatrix();
      connectionsMesh.setMatrixAt(connectionIndex, connectionDummy.matrix);
      connectionIndex += 1;
    }

    connectionsMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={pointsRef}
        args={[undefined, undefined, LANDMARK_COUNT]}
      >
        <sphereGeometry args={[pointRadius, 16, 16]} />
        <meshBasicMaterial color={pointColor} />
      </instancedMesh>
      <instancedMesh
        ref={connectionsRef}
        args={[undefined, undefined, HAND_CONNECTIONS.length]}
      >
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshBasicMaterial color={lineColor} />
      </instancedMesh>
    </group>
  );
}

function HandSkeleton3D({
  landmarksRef,
  modelRef,
}: {
  landmarksRef: React.MutableRefObject<NormalizedLandmark[][]>;
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <>
      <HandMesh handIndex={0} landmarksRef={landmarksRef} modelRef={modelRef} />
      <HandMesh handIndex={1} landmarksRef={landmarksRef} modelRef={modelRef} />
    </>
  );
}

export default function ModelPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[][]>([]);

  useEffect(() => {
    let mounted = true;

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Created TensorFlow Lite XNNPACK delegate for CPU")
      ) {
        return;
      }
      originalConsoleError(...args);
    };

    const setup = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });

      recognizerRef.current = recognizer;

      const loop = () => {
        if (!mounted) return;
        if (video.readyState >= 2 && recognizerRef.current) {
          const now = performance.now();
          const result = recognizerRef.current.recognizeForVideo(video, now);
          landmarksRef.current = result.landmarks ?? [];
        }
        rafRef.current = requestAnimationFrame(loop);
      };

      loop();
    };

    setup();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      recognizerRef.current?.close();
      recognizerRef.current = null;

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }

      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#2b2b2b"]} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#bdbdbd", 0.8]} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />

        <Suspense fallback={null}>
          <Model modelRef={modelRef} />
        </Suspense>

        <HandSkeleton3D landmarksRef={landmarksRef} modelRef={modelRef} />
      </Canvas>

      <video
        ref={videoRef}
        className="pointer-events-none absolute top-3 right-3 h-36 w-48 transform -scale-x-100 rounded-md border border-white/30 object-cover shadow-lg"
        playsInline
        muted
      />
    </div>
  );
}
