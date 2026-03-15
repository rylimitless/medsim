import React, { useCallback } from "react";
import * as THREE from "three";

export default function useRotationControls(
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
