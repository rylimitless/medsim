"use client";

import React, { Suspense, useEffect, useRef, useCallback } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ThreeEvent } from "@react-three/fiber";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import useRotationControls from "./functions/use_rotations";

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

type TooltipState = {
  time: number;
  distance: number;
  name: string;
  point: THREE.Vector3;
};

type GestureCategory = {
  categoryName?: string;
  displayName?: string;
  score?: number;
};

type GestureList = GestureCategory[][];

const ENABLE_MESH_TOOLTIP = false;
const POINTING_GESTURE = "Pointing_Up";
const MIN_CUT_DISTANCE = 0.01;
const MAX_CUT_POINTS = 6000;
const INDEX_DIP = 7;
const INDEX_TIP = 8;

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

function Model({
  modelRef,
  meshListRef,
}: {
  modelRef: React.RefObject<THREE.Group | null>;
  meshListRef: React.MutableRefObject<THREE.Object3D[]>;
}) {
  const gltf = useLoader(GLTFLoader, "/model/model2.glb");
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const { applyRotation } = useRotationControls(modelRef); //useRotationControls(modelRef);

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

    const meshes: THREE.Object3D[] = [];
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        meshes.push(obj);
      }
    });
    meshListRef.current = meshes;
  }, [gltf, meshListRef]);

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
  gesturesRef,
  cutPointsRef,
  lastCutPointRef,
  modelRef,
  meshListRef,
  tooltipRef,
  tooltipStateRef,
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
  gesturesRef: React.MutableRefObject<GestureList>;
  cutPointsRef: React.MutableRefObject<THREE.Vector3[]>;
  lastCutPointRef: React.MutableRefObject<Array<THREE.Vector3 | null>>;
  modelRef: React.RefObject<THREE.Group | null>;
  meshListRef: React.MutableRefObject<THREE.Object3D[]>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipStateRef: React.MutableRefObject<TooltipState>;
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
  const modelSphereRef = useRef(new THREE.Sphere());
  const sphereHitRef = useRef(new THREE.Vector3());
  const boxHitRef = useRef(new THREE.Vector3());
  const hitResultsRef = useRef<THREE.Intersection[]>([]);
  const projectedRef = useRef(new THREE.Vector3());
  const scalpelRef = useRef<THREE.Group>(null);
  const scalpelDirRef = useRef(new THREE.Vector3());
  const scalpelQuatRef = useRef(new THREE.Quaternion());
  const scalpelUpRef = useRef(new THREE.Vector3(0, 1, 0));
  const scalpelRaycasterRef = useRef(new THREE.Raycaster());
  const scalpelDirNegRef = useRef(new THREE.Vector3());
  const indexTipHitRef = useRef(new THREE.Vector3());

  useFrame(({ camera, clock, size }) => {
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
    const meshes = meshListRef.current;
    const modelBox = modelBoxRef.current;
    const modelSphere = modelSphereRef.current;
    const sphereHit = sphereHitRef.current;
    const boxHit = boxHitRef.current;
    const hitResults = hitResultsRef.current;
    const tooltipState = tooltipStateRef.current;
    const tooltipEl = tooltipRef.current;
    const projected = projectedRef.current;
    const gestures = gesturesRef.current;
    const cutPoints = cutPointsRef.current;
    const lastCutPoint = lastCutPointRef.current;
    const scalpel = scalpelRef.current;
    const scalpelDir = scalpelDirRef.current;
    const scalpelQuat = scalpelQuatRef.current;
    const scalpelUp = scalpelUpRef.current;
    const scalpelRaycaster = scalpelRaycasterRef.current;
    const scalpelDirNeg = scalpelDirNegRef.current;
    const indexTipHit = indexTipHitRef.current;

    if (ENABLE_MESH_TOOLTIP) {
      const time = clock.getElapsedTime();
      if (tooltipState.time !== time) {
        tooltipState.time = time;
        tooltipState.distance = Number.POSITIVE_INFINITY;
        tooltipState.name = "";
      }
    }

    const hasModel = Boolean(model && meshes.length > 0);
    if (hasModel) {
      modelBox.setFromObject(model as THREE.Object3D);
      modelBox.getBoundingSphere(modelSphere);
    }

    const gesture = gestures?.[handIndex]?.[0];
    const gestureName = gesture?.categoryName ?? gesture?.displayName ?? "";
    let tipHitValid = false;

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
        const boxHitPoint = raycaster.ray.intersectBox(modelBox, boxHit);
        if (boxHitPoint) {
          const outDist = camera.position.distanceTo(out);
          const hitDist = camera.position.distanceTo(boxHitPoint);
          if (outDist > hitDist) {
            out
              .copy(boxHitPoint)
              .addScaledVector(raycaster.ray.direction, -collisionOffset);
          }
        }

        if (i === INDEX_TIP) {
          if (raycaster.ray.intersectSphere(modelSphere, sphereHit)) {
            hitResults.length = 0;
            raycaster.intersectObjects(meshes, false, hitResults);

            if (hitResults.length > 0) {
              const hit = hitResults[0];
              indexTipHit.copy(hit.point);
              tipHitValid = true;
            }
          }
        }
      }
    }

    const cutEnabled = tipHitValid;

    if (!cutEnabled) {
      lastCutPoint[handIndex] = null;
    }

    if (cutEnabled && hasModel) {
      const hitPoint = indexTipHit;

      const last = lastCutPoint[handIndex];
      if (!last || last.distanceTo(hitPoint) > MIN_CUT_DISTANCE) {
        if (last) {
          cutPoints.push(last.clone(), hitPoint.clone());
          if (cutPoints.length > MAX_CUT_POINTS) {
            cutPoints.splice(0, cutPoints.length - MAX_CUT_POINTS);
          }
        }
        lastCutPoint[handIndex] = hitPoint.clone();
      }
    }

    if (scalpel) {
      if (cutEnabled) {
        const tip = worldPositions[INDEX_TIP];
        const base = worldPositions[INDEX_DIP] ?? tip;
        scalpelDir.copy(tip).sub(base);
        if (scalpelDir.lengthSq() > 0.000001) {
          scalpelDir.normalize();
          scalpelQuat.setFromUnitVectors(scalpelUp, scalpelDir);
          scalpel.position.copy(tip);
          scalpel.quaternion.copy(scalpelQuat);
          scalpel.visible = true;
        } else {
          scalpel.visible = false;
        }
      } else {
        scalpel.visible = false;
      }
    }

    if (tooltipEl) {
      if (
        ENABLE_MESH_TOOLTIP &&
        tooltipState.distance !== Number.POSITIVE_INFINITY
      ) {
        projected.copy(tooltipState.point).project(camera);
        const x = (projected.x * 0.5 + 0.5) * size.width;
        const y = (-projected.y * 0.5 + 0.5) * size.height;

        tooltipEl.textContent = tooltipState.name || "Mesh";
        tooltipEl.style.opacity = "1";
        tooltipEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
      } else {
        tooltipEl.style.opacity = "0";
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
      <group ref={scalpelRef} visible={false}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.12, 8]} />
          <meshStandardMaterial
            color="#dfe6e9"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <coneGeometry args={[0.006, 0.04, 8]} />
          <meshStandardMaterial
            color="#b2bec3"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

function CutLines({
  cutPointsRef,
}: {
  cutPointsRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positionsRef = useRef<Float32Array>(
    new Float32Array(MAX_CUT_POINTS * 3),
  );

  useEffect(() => {
    const geom = geometryRef.current;
    if (!geom) return;

    const attr = new THREE.BufferAttribute(positionsRef.current, 3);
    geom.setAttribute("position", attr);
    geom.setDrawRange(0, 0);
  }, []);

  useFrame(() => {
    const geom = geometryRef.current;
    if (!geom) return;

    const points = cutPointsRef.current;
    const count = Math.min(points.length, MAX_CUT_POINTS);
    const positions = positionsRef.current;

    for (let i = 0; i < count; i += 1) {
      const p = points[i];
      const idx = i * 3;
      positions[idx] = p.x;
      positions[idx + 1] = p.y;
      positions[idx + 2] = p.z;
    }

    geom.setDrawRange(0, count);
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color="#ff2d2d" linewidth={2} />
    </lineSegments>
  );
}

function HandSkeleton3D({
  landmarksRef,
  gesturesRef,
  cutPointsRef,
  lastCutPointRef,
  modelRef,
  meshListRef,
  tooltipRef,
  tooltipStateRef,
}: {
  landmarksRef: React.MutableRefObject<NormalizedLandmark[][]>;
  gesturesRef: React.MutableRefObject<GestureList>;
  cutPointsRef: React.MutableRefObject<THREE.Vector3[]>;
  lastCutPointRef: React.MutableRefObject<Array<THREE.Vector3 | null>>;
  modelRef: React.RefObject<THREE.Group | null>;
  meshListRef: React.MutableRefObject<THREE.Object3D[]>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipStateRef: React.MutableRefObject<TooltipState>;
}) {
  return (
    <>
      <HandMesh
        handIndex={0}
        landmarksRef={landmarksRef}
        gesturesRef={gesturesRef}
        cutPointsRef={cutPointsRef}
        lastCutPointRef={lastCutPointRef}
        modelRef={modelRef}
        meshListRef={meshListRef}
        tooltipRef={tooltipRef}
        tooltipStateRef={tooltipStateRef}
      />
      <HandMesh
        handIndex={1}
        landmarksRef={landmarksRef}
        gesturesRef={gesturesRef}
        cutPointsRef={cutPointsRef}
        lastCutPointRef={lastCutPointRef}
        modelRef={modelRef}
        meshListRef={meshListRef}
        tooltipRef={tooltipRef}
        tooltipStateRef={tooltipStateRef}
      />
    </>
  );
}

function TopBar() {
  return (
    <div className="pointer-events-auto absolute left-6 right-6 top-4 flex items-center justify-between rounded-2xl bg-black/40 px-4 py-3 text-white shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
          <span className="text-lg">🧠</span>
        </div>
        <div>
          <p className="text-sm font-semibold">
            AI Neurosurgical Training Simulator
          </p>
          <p className="text-xs text-white/60">Advanced Diagnostics v2.0</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-200">
          Explore Mode
        </button>
        <button className="h-9 w-9 rounded-full bg-white/10 text-white/70">
          🔔
        </button>
        <button className="h-9 w-9 rounded-full bg-white/10 text-white/70">
          ⚙️
        </button>
        <div className="h-9 w-9 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function LeftRail() {
  return (
    <div className="pointer-events-auto absolute left-4 top-24 flex flex-col gap-3 rounded-2xl bg-black/40 p-3 text-white shadow-lg backdrop-blur">
      <button className="h-10 w-10 rounded-xl bg-blue-500/20">🧭</button>
      <button className="h-10 w-10 rounded-xl bg-white/10">🧪</button>
      <button className="h-10 w-10 rounded-xl bg-white/10">🧠</button>
      <button className="h-10 w-10 rounded-xl bg-white/10">🔗</button>
    </div>
  );
}

function RightRail() {
  return (
    <div className="pointer-events-auto absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2 rounded-2xl bg-black/40 p-3 text-white shadow-lg backdrop-blur">
      <button className="h-9 w-9 rounded-lg bg-white/10 text-lg">+</button>
      <button className="h-9 w-9 rounded-lg bg-white/10 text-lg">−</button>
      <button className="h-9 w-9 rounded-lg bg-white/10 text-sm">3D</button>
    </div>
  );
}

function VitalsCard() {
  return (
    <div className="pointer-events-auto rounded-2xl bg-black/50 p-4 text-white shadow-lg backdrop-blur">
      <p className="text-xs font-semibold text-white/70">VITALS</p>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-lg font-semibold">72 BPM</div>
        <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-300">
          STABLE
        </div>
      </div>
    </div>
  );
}

function RiskCard() {
  return (
    <div className="pointer-events-auto rounded-2xl bg-black/50 p-4 text-white shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Surgical Risk</p>
        <p className="text-sm font-semibold text-blue-300">40%</p>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
        <div className="h-1.5 w-2/5 rounded-full bg-blue-400" />
      </div>
      <p className="mt-3 text-xs text-amber-300">
        Caution: Motor cortex proximity
      </p>
    </div>
  );
}

export default function ModelPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const meshListRef = useRef<THREE.Object3D[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipStateRef = useRef<TooltipState>({
    time: -1,
    distance: Number.POSITIVE_INFINITY,
    name: "",
    point: new THREE.Vector3(),
  });
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[][]>([]);
  const gesturesRef = useRef<GestureList>([]);
  const cutPointsRef = useRef<THREE.Vector3[]>([]);
  const lastCutPointRef = useRef<Array<THREE.Vector3 | null>>([null, null]);

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
        minHandDetectionConfidence: 0.01,
        minHandPresenceConfidence: 0.01,
        minTrackingConfidence: 0.01,
      });

      recognizerRef.current = recognizer;

      const loop = () => {
        if (!mounted) return;
        if (video.readyState >= 2 && recognizerRef.current) {
          const now = performance.now();
          const result = recognizerRef.current.recognizeForVideo(video, now);
          landmarksRef.current = result.landmarks ?? [];
          gesturesRef.current = result.gestures ?? [];
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
        camera={{ position: [0, 0, 2.6], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#2b2b2b"]} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#bdbdbd", 0.8]} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />

        <Suspense fallback={null}>
          <Model modelRef={modelRef} meshListRef={meshListRef} />
        </Suspense>

        <CutLines cutPointsRef={cutPointsRef} />

        <HandSkeleton3D
          landmarksRef={landmarksRef}
          gesturesRef={gesturesRef}
          cutPointsRef={cutPointsRef}
          lastCutPointRef={lastCutPointRef}
          modelRef={modelRef}
          meshListRef={meshListRef}
          tooltipRef={tooltipRef}
          tooltipStateRef={tooltipStateRef}
        />
      </Canvas>

      <TopBar />
      <LeftRail />
      <RightRail />

      <div className="pointer-events-none absolute left-1/2 top-24 w-[420px] -translate-x-1/2 rounded-2xl bg-black/40 px-4 py-2 text-xs text-white/60 shadow-lg backdrop-blur">
        Search anatomical structures...
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 w-56">
        <VitalsCard />
      </div>

      <div className="pointer-events-none absolute bottom-6 right-6 w-64">
        <RiskCard />
      </div>

      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 shadow-lg"
      />
      <video
        ref={videoRef}
        className="pointer-events-none absolute top-20 right-6 h-36 w-48 transform -scale-x-100 rounded-md border border-white/30 object-cover shadow-lg"
        playsInline
        muted
      />
    </div>
  );
}
