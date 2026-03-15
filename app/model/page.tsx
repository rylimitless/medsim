"use client";

import React, {
  Suspense,
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ThreeEvent } from "@react-three/fiber";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import useRotationControls from "./functions/use_rotations";
import { type CameraMoveState } from "./functions/moveToMesh";
import {
  createPinchZoomState,
  updatePinchZoom,
  type PinchZoomState,
} from "./functions/zoom";
import printMeshName from "./functions/print_mesh_name";
import { useControlStore } from "../store/control_store";

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
type HandednessList = GestureCategory[][];

const ENABLE_MESH_TOOLTIP = false;
const MIN_CUT_DISTANCE = 0.01;
const MAX_CUT_POINTS = 6000;
const INDEX_DIP = 7;
const INDEX_TIP = 8;

const LANDMARK_COUNT = 21;
const LEFT_HAND_VISIBLE_INDICES = [5, 6, 7, 8];

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

function createLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const fontSize = 48;
  const paddingX = 24;
  const paddingY = 14;
  ctx.font = `600 ${fontSize}px "Arial", sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + paddingX * 2;
  canvas.height = textHeight + paddingY * 2;

  ctx.font = `600 ${fontSize}px "Arial", sans-serif`;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, paddingX, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function Model({
  modelRef,
  meshListRef,
  onMeshSelect,
  cutPointsRef,
}: {
  modelRef: React.RefObject<THREE.Group | null>;
  meshListRef: React.MutableRefObject<THREE.Object3D[]>;
  onMeshSelect?: (mesh: THREE.Object3D) => void;
  cutPointsRef: React.MutableRefObject<THREE.Vector3[]>;
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
    e.stopPropagation();
    if (onMeshSelect && e.button === 0) {
      const hit = e.intersections?.[0]?.object;
      if (hit && (hit as THREE.Mesh).isMesh) {
        onMeshSelect(hit);
      }
    }
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
      <CutLines cutPointsRef={cutPointsRef} />
      <primitive object={gltf.scene} />
    </group>
  );
}

function HandMesh({
  handIndex,
  landmarksRef,
  handednessRef,
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
  handednessRef: React.MutableRefObject<HandednessList>;
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
  const scalpelLabelRef = useRef<THREE.Sprite>(null);
  const labelOffsetRef = useRef(new THREE.Vector3(0.03, 0.03, 0));
  const scalpelLabelTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createLabelTexture("scapel");
  }, []);
  const addCutMesh = useControlStore((state) => state.addCutMesh);
  const currentHitMeshRef = useRef<THREE.Object3D | null>(null);

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
  const indexTipHitRef = useRef(new THREE.Vector3());
  const pinchZoomStateRef = useRef<PinchZoomState | null>(null);
  const pinchPrevDistanceRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const rightRotatePrevRef = useRef(new THREE.Vector2());
  const rightRotateHasPrevRef = useRef(false);
  const rightRotateTempRef = useRef(new THREE.Vector2());
  const rightRotateFilteredRef = useRef(new THREE.Vector2());
  const rightRotateConfigRef = useRef({
    sensitivityX: 4.5,
    sensitivityY: 4.5,
    deadzone: 0.002,
    smoothing: 0.28,
    maxSpeed: 0.08,
  });
  const rightRotateSnapRef = useRef({
    snapDegrees: 15,
    snapOnSpeed: 0.012,
    snapBlend: 0.25,
  });
  const pinchConfigRef = useRef({
    minDistance: 0.6,
    maxDistance: 6,
    speed: 4.2,
    smoothing: 0.08,
    pinchThreshold: 0.12,
    deadzone: 0.002,
  });

  useFrame(({ camera, clock, size }) => {
    const landmarks = landmarksRef.current[handIndex];
    const handednessEntry = handednessRef.current[handIndex];
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
    const cutPoints = cutPointsRef.current;
    const lastCutPoint = lastCutPointRef.current;
    const indexTipHit = indexTipHitRef.current;
    const elapsedTime = clock.getElapsedTime();
    const lastFrameTime = lastFrameTimeRef.current;
    const rawDelta = lastFrameTime === null ? 0 : elapsedTime - lastFrameTime;
    lastFrameTimeRef.current = elapsedTime;
    const deltaTime = Math.min(rawDelta, 0.05);
    const pinchConfig = pinchConfigRef.current;

    if (ENABLE_MESH_TOOLTIP) {
      const time = clock.getElapsedTime();
      if (tooltipState.time !== time) {
        tooltipState.time = time;
        tooltipState.distance = Number.POSITIVE_INFINITY;
        tooltipState.name = "";
      }
    }

    const handednessLabel =
      handednessEntry?.[0]?.categoryName ??
      handednessEntry?.[0]?.displayName ??
      "";
    const allowCutting = handednessLabel
      ? handednessLabel === "Left"
      : handIndex === 0;
    const shouldCheckModel = allowCutting;
    const hasModel = Boolean(model && meshes.length > 0);
    if (hasModel && shouldCheckModel) {
      modelBox.setFromObject(model as THREE.Object3D);
      modelBox.getBoundingSphere(modelSphere);
    }

    let tipHitValid = false;
    currentHitMeshRef.current = null;

    if (!pointsMesh || !connectionsMesh) return;

    if (!landmarks || landmarks.length === 0) {
      pointsMesh.visible = false;
      connectionsMesh.visible = false;
      if (scalpelLabelRef.current) {
        scalpelLabelRef.current.visible = false;
      }
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

      if (hasModel && shouldCheckModel) {
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
              currentHitMeshRef.current = hit.object;
              tipHitValid = true;
            }
          }
        }
      }
    }

    if (scalpelLabelRef.current) {
      const shouldShowLabel = allowCutting && Boolean(landmarks[5]);
      scalpelLabelRef.current.visible =
        shouldShowLabel && Boolean(scalpelLabelTexture);
      if (scalpelLabelRef.current.visible) {
        scalpelLabelRef.current.position
          .copy(worldPositions[5])
          .add(labelOffsetRef.current);
      }
    }

    const isRightHand = handednessLabel
      ? handednessLabel === "Right"
      : handIndex === 1;

    let isPinching = false;

    if (isRightHand && landmarks[4] && landmarks[8]) {
      const thumb = landmarks[4];
      const index = landmarks[8];
      const thumbX = mirror ? 1 - thumb.x : thumb.x;
      const indexX = mirror ? 1 - index.x : index.x;
      const dx = thumbX - indexX;
      const dy = thumb.y - index.y;
      const distance = Math.hypot(dx, dy);
      const delta =
        pinchPrevDistanceRef.current === null
          ? 0
          : pinchPrevDistanceRef.current - distance;
      isPinching = distance < pinchConfig.pinchThreshold;

      if (!isPinching) {
        pinchPrevDistanceRef.current = null;
      } else {
        pinchPrevDistanceRef.current = distance;

        if (!pinchZoomStateRef.current) {
          pinchZoomStateRef.current = createPinchZoomState(camera, {
            minDistance: pinchConfig.minDistance,
            maxDistance: pinchConfig.maxDistance,
            speed: pinchConfig.speed,
            smoothing: pinchConfig.smoothing,
          });
        }

        const pinchDelta =
          Math.abs(delta) > pinchConfig.deadzone
            ? THREE.MathUtils.clamp(delta, -0.05, 0.05)
            : 0;

        if (pinchDelta !== 0) {
          updatePinchZoom(
            camera,
            pinchDelta,
            deltaTime,
            pinchZoomStateRef.current,
            {
              minDistance: pinchConfig.minDistance,
              maxDistance: pinchConfig.maxDistance,
              speed: pinchConfig.speed,
              smoothing: pinchConfig.smoothing,
            },
          );
        }
      }
    } else {
      pinchPrevDistanceRef.current = null;
    }

    if (isRightHand && model && landmarks[INDEX_TIP]) {
      const tip = landmarks[INDEX_TIP];
      const current = rightRotateTempRef.current;
      const nx = mirror ? 1 - tip.x : tip.x;
      current.set(nx, tip.y);

      if (rightRotateHasPrevRef.current && !isPinching) {
        const prev = rightRotatePrevRef.current;
        const config = rightRotateConfigRef.current;
        const filtered = rightRotateFilteredRef.current;
        const rawDx = current.x - prev.x;
        const rawDy = current.y - prev.y;
        const magnitude = Math.hypot(rawDx, rawDy);
        const t = 1 - Math.exp(-config.smoothing * deltaTime * 60);

        if (magnitude > config.deadzone) {
          filtered.x = THREE.MathUtils.lerp(filtered.x, rawDx, t);
          filtered.y = THREE.MathUtils.lerp(filtered.y, rawDy, t);
        } else {
          filtered.multiplyScalar(1 - t);
          if (filtered.lengthSq() < config.deadzone * config.deadzone) {
            filtered.set(0, 0);
          }
        }

        let dx = filtered.x * config.sensitivityX;
        let dy = filtered.y * config.sensitivityY;
        dx = THREE.MathUtils.clamp(dx, -config.maxSpeed, config.maxSpeed);
        dy = THREE.MathUtils.clamp(dy, -config.maxSpeed, config.maxSpeed);

        if (dx !== 0 || dy !== 0) {
          model.rotation.y -= dx;
          model.rotation.x += dy;
          model.rotation.x = THREE.MathUtils.clamp(
            model.rotation.x,
            -Math.PI / 2,
            Math.PI / 2,
          );
        }

        const snap = rightRotateSnapRef.current;
        const speed = Math.hypot(dx, dy);
        if (speed < snap.snapOnSpeed) {
          const snapRad = THREE.MathUtils.degToRad(snap.snapDegrees);
          const targetY = Math.round(model.rotation.y / snapRad) * snapRad;
          const targetX = Math.round(model.rotation.x / snapRad) * snapRad;
          model.rotation.y = THREE.MathUtils.lerp(
            model.rotation.y,
            targetY,
            snap.snapBlend,
          );
          model.rotation.x = THREE.MathUtils.lerp(
            model.rotation.x,
            targetX,
            snap.snapBlend,
          );
          model.rotation.x = THREE.MathUtils.clamp(
            model.rotation.x,
            -Math.PI / 2,
            Math.PI / 2,
          );
        }
      }

      rightRotatePrevRef.current.copy(current);
      rightRotateHasPrevRef.current = true;
    } else {
      rightRotateHasPrevRef.current = false;
      rightRotateFilteredRef.current.set(0, 0);
    }

    const cutEnabled = allowCutting && tipHitValid;

    if (!cutEnabled) {
      lastCutPoint[handIndex] = null;
    }

    if (cutEnabled && hasModel) {
      if (!model) return;
      const hitPoint = indexTipHit;
      const localHit = hitPoint.clone();
      model.worldToLocal(localHit);

      const hitMesh = currentHitMeshRef.current;
      if (hitMesh) {
        const name = hitMesh.name || hitMesh.parent?.name || "Mesh";
        addCutMesh({ uuid: hitMesh.uuid, name });
      }

      const last = lastCutPoint[handIndex];
      if (!last || last.distanceTo(localHit) > MIN_CUT_DISTANCE) {
        if (last) {
          cutPoints.push(last.clone(), localHit.clone());
          if (cutPoints.length > MAX_CUT_POINTS) {
            cutPoints.splice(0, cutPoints.length - MAX_CUT_POINTS);
          }
        }
        lastCutPoint[handIndex] = localHit.clone();
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
      const isVisible = !allowCutting || LEFT_HAND_VISIBLE_INDICES.includes(i);
      dummy.position.copy(worldPositions[i]);
      dummy.scale.setScalar(isVisible ? 1 : 0);
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

      const showConnection =
        !allowCutting ||
        (LEFT_HAND_VISIBLE_INDICES.includes(a) &&
          LEFT_HAND_VISIBLE_INDICES.includes(b));

      if (!showConnection) {
        connectionDummy.position.copy(tempMid);
        connectionDummy.quaternion.identity();
        connectionDummy.scale.set(0, 0, 0);
      } else if (length === 0) {
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
      {scalpelLabelTexture && (
        <sprite ref={scalpelLabelRef} scale={[0.18, 0.07, 1]}>
          <spriteMaterial
            map={scalpelLabelTexture}
            transparent
            depthTest={false}
          />
        </sprite>
      )}
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
  handednessRef,
  cutPointsRef,
  lastCutPointRef,
  modelRef,
  meshListRef,
  tooltipRef,
  tooltipStateRef,
}: {
  landmarksRef: React.MutableRefObject<NormalizedLandmark[][]>;
  handednessRef: React.MutableRefObject<HandednessList>;
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
        handednessRef={handednessRef}
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
        handednessRef={handednessRef}
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

function CameraFocusController({
  selectedMesh,
  modelRef,
}: {
  selectedMesh: THREE.Object3D | null;
  modelRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const moveRef = useRef<CameraMoveState | null>(null);
  const lookAtRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!selectedMesh || !modelRef.current) return;

    const model = modelRef.current;
    const modelBox = new THREE.Box3().setFromObject(model);
    const modelSphere = new THREE.Sphere();
    modelBox.getBoundingSphere(modelSphere);
    if (!Number.isFinite(modelSphere.radius)) return;

    const meshBox = new THREE.Box3().setFromObject(selectedMesh);
    const meshCenter = new THREE.Vector3();
    meshBox.getCenter(meshCenter);

    const modelCenter = modelSphere.center.clone();
    const toMesh = meshCenter.clone().sub(modelCenter);
    if (toMesh.lengthSq() < 0.000001) {
      toMesh.set(0, 0, 1);
    } else {
      toMesh.normalize();
    }

    const minDistance = modelSphere.radius * 2.2;
    const currentDistance = camera.position.distanceTo(modelCenter);
    const distance = Math.max(minDistance, currentDistance);

    const targetPosition = modelCenter
      .clone()
      .addScaledVector(toMesh, distance);
    const lookFrom = camera.position
      .clone()
      .add(camera.getWorldDirection(new THREE.Vector3()));

    moveRef.current = {
      from: camera.position.clone(),
      to: targetPosition,
      lookFrom,
      lookTo: meshCenter,
      start: performance.now(),
      duration: 1.4,
    };
  }, [camera, modelRef, selectedMesh]);

  useFrame(() => {
    const move = moveRef.current;
    if (!move) return;
    const t = Math.min(
      (performance.now() - move.start) / (move.duration * 1000),
      1,
    );
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(move.from, move.to, ease);
    lookAtRef.current.lerpVectors(move.lookFrom, move.lookTo, ease);
    camera.lookAt(lookAtRef.current);
    if (t >= 1) {
      moveRef.current = null;
    }
  });

  return null;
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
  const [selectionToast, setSelectionToast] = useState<{
    name: string;
    visible: boolean;
  }>({ name: "", visible: false });
  const toastTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[][]>([]);
  const gesturesRef = useRef<GestureList>([]);
  const handednessRef = useRef<HandednessList>([]);
  const cutPointsRef = useRef<THREE.Vector3[]>([]);
  const lastCutPointRef = useRef<Array<THREE.Vector3 | null>>([null, null]);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const highlightedMeshRef = useRef<THREE.Mesh | null>(null);

  const setMeshHighlight = useCallback((mesh: THREE.Mesh, enabled: boolean) => {
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    materials.forEach((material, index) => {
      if (!material) return;
      let mat = material as THREE.MeshStandardMaterial & {
        emissive?: THREE.Color;
        emissiveIntensity?: number;
        color?: THREE.Color;
        userData: Record<string, unknown>;
      };

      if (!mat.userData) {
        mat.userData = {};
      }
      const userData = mat.userData as Record<string, unknown>;

      if (enabled && !userData.__meshHighlightCloned) {
        const cloned = mat.clone();
        cloned.userData = {
          ...(cloned.userData ?? {}),
          __meshHighlightCloned: true,
        };
        if (Array.isArray(mesh.material)) {
          const nextMaterials = [...mesh.material];
          nextMaterials[index] = cloned;
          mesh.material = nextMaterials;
        } else {
          mesh.material = cloned;
        }
        mat = cloned as typeof mat;
      }

      if (enabled) {
        if (!userData.__highlightOriginal) {
          userData.__highlightOriginal = {
            color: mat.color ? mat.color.getHex() : undefined,
            emissive: mat.emissive ? mat.emissive.getHex() : undefined,
            emissiveIntensity: mat.emissiveIntensity,
          };
        }
        if (mat.emissive) {
          mat.emissive.set("#3b82f6");
          mat.emissiveIntensity = 0.8;
        } else if (mat.color) {
          mat.color.set("#9bd1ff");
        }
      } else {
        const original = userData.__highlightOriginal as
          | { color?: number; emissive?: number; emissiveIntensity?: number }
          | undefined;

        if (original) {
          if (mat.color && original.color !== undefined) {
            mat.color.setHex(original.color);
          }
          if (mat.emissive && original.emissive !== undefined) {
            mat.emissive.setHex(original.emissive);
            if (original.emissiveIntensity !== undefined) {
              mat.emissiveIntensity = original.emissiveIntensity;
            }
          }
        }
      }
    });
  }, []);

  const handleMeshSelect = useCallback(
    (object: THREE.Object3D) => {
      if (!(object as THREE.Mesh).isMesh) return;
      const mesh = object as THREE.Mesh;
      printMeshName(mesh);

      if (highlightedMeshRef.current && highlightedMeshRef.current !== mesh) {
        setMeshHighlight(highlightedMeshRef.current, false);
      }

      setMeshHighlight(mesh, true);
      highlightedMeshRef.current = mesh;
      setSelectedMesh(mesh);

      const selectionName = mesh.name || mesh.parent?.name || "Mesh";
      setSelectionToast({ name: selectionName, visible: true });
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setSelectionToast((prev) => ({ ...prev, visible: false }));
      }, 1800);
    },
    [setMeshHighlight, setSelectionToast],
  );

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
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      recognizerRef.current = recognizer;

      const loop = () => {
        if (!mounted) return;
        if (video.readyState >= 2 && recognizerRef.current) {
          const now = performance.now();
          const result = recognizerRef.current.recognizeForVideo(video, now);
          landmarksRef.current = result.landmarks ?? [];
          gesturesRef.current = result.gestures ?? [];
          handednessRef.current = result.handednesses ?? [];
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
          <Model
            modelRef={modelRef}
            meshListRef={meshListRef}
            onMeshSelect={handleMeshSelect}
            cutPointsRef={cutPointsRef}
          />
        </Suspense>
        <CameraFocusController
          selectedMesh={selectedMesh}
          modelRef={modelRef}
        />

        <HandSkeleton3D
          landmarksRef={landmarksRef}
          handednessRef={handednessRef}
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
      <div
        className={`pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs text-white shadow-lg transition-opacity duration-200 ${
          selectionToast.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectionToast.name}
      </div>
      <video
        ref={videoRef}
        className="pointer-events-none absolute top-20 right-6 h-36 w-48 transform -scale-x-100 rounded-md border border-white/30 object-cover shadow-lg"
        playsInline
        muted
      />
    </div>
  );
}
