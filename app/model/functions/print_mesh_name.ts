import type { Object3D } from "three";

const getMeshName = (mesh?: Object3D | null) => {
  if (!mesh) return "";
  return mesh.name || mesh.parent?.name || "";
};

export default function printMeshName(mesh?: Object3D | null) {
  const name = getMeshName(mesh);
  if (name) {
    console.log(`Mesh selected: ${name}`);
  } else {
    console.log("Mesh selected");
  }
}
