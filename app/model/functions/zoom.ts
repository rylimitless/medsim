import * as THREE from "three";

export type PinchZoomConfig = {
  minDistance?: number;
  maxDistance?: number;
  speed?: number;
  smoothing?: number;
};

export type PinchZoomState = {
  targetDistance: number;
  currentDistance: number;
  initialized: boolean;
};

const DEFAULT_CONFIG: Required<PinchZoomConfig> = {
  minDistance: 0.6,
  maxDistance: 6,
  speed: 2.0,
  smoothing: 0.15,
};

export function createPinchZoomState(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  config: PinchZoomConfig = {},
): PinchZoomState {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const initialDistance = Math.min(
    cfg.maxDistance,
    Math.max(cfg.minDistance, camera.position.length()),
  );

  return {
    targetDistance: initialDistance,
    currentDistance: initialDistance,
    initialized: true,
  };
}

export function updatePinchZoom(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  pinchDelta: number,
  deltaTime: number,
  state: PinchZoomState,
  config: PinchZoomConfig = {},
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!state.initialized) {
    const initDistance = Math.min(
      cfg.maxDistance,
      Math.max(cfg.minDistance, camera.position.length()),
    );
    state.targetDistance = initDistance;
    state.currentDistance = initDistance;
    state.initialized = true;
  }

  const scaledDelta = pinchDelta * cfg.speed;
  state.targetDistance = THREE.MathUtils.clamp(
    state.targetDistance - scaledDelta,
    cfg.minDistance,
    cfg.maxDistance,
  );

  const t = THREE.MathUtils.clamp(cfg.smoothing * deltaTime * 60, 0, 1);
  state.currentDistance = THREE.MathUtils.lerp(
    state.currentDistance,
    state.targetDistance,
    t,
  );

  const direction = camera.position.clone().normalize();
  if (direction.lengthSq() < 0.000001) {
    direction.set(0, 0, 1);
  }
  camera.position.copy(direction.multiplyScalar(state.currentDistance));
}

export function computePinchDelta(
  thumbTip: THREE.Vector3,
  indexTip: THREE.Vector3,
  prevDistance: number | null,
) {
  const distance = thumbTip.distanceTo(indexTip);
  const delta = prevDistance === null ? 0 : prevDistance - distance;
  return { distance, delta };
}
