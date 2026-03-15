import * as THREE from "three";

export type CameraMoveState = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  lookFrom: THREE.Vector3;
  lookTo: THREE.Vector3;
  start: number;
  duration: number;
};

type MoveToMeshOptions = {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  mesh: THREE.Object3D;
  duration?: number;
  distanceScale?: number;
  minDistance?: number;
};

export default function moveToMesh({
  camera,
  mesh,
  duration = 0.6,
  distanceScale = 2.4,
  minDistance = 0.6,
}: MoveToMeshOptions): CameraMoveState | null {
  const box = new THREE.Box3().setFromObject(mesh);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  if (!Number.isFinite(sphere.radius)) {
    return null;
  }

  const center = sphere.center.clone();
  const direction = camera.position.clone().sub(center);
  if (direction.lengthSq() < 0.000001) {
    direction.set(0, 0, 1);
  } else {
    direction.normalize();
  }

  const distance = Math.max(minDistance, sphere.radius * distanceScale);
  const targetPosition = center.clone().addScaledVector(direction, distance);
  const lookFrom = camera.position
    .clone()
    .add(camera.getWorldDirection(new THREE.Vector3()));

  return {
    from: camera.position.clone(),
    to: targetPosition,
    lookFrom,
    lookTo: center,
    start: performance.now(),
    duration,
  };
}
