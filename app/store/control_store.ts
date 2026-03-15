import { create } from "zustand";

type CutMesh = { uuid: string; name: string };

const initialState = { rotating: false, cutMeshes: [] as CutMesh[] };

type Control = typeof initialState & {
  setRotating: (value: boolean) => void;
  addCutMesh: (mesh: CutMesh) => void;
  print: () => void;
};

export const useControlStore = create<Control>((set, get) => ({
  ...initialState,
  setRotating: (value) => set({ rotating: value }),
  addCutMesh: (mesh) => {
    const existing = get().cutMeshes;
    if (existing.some((item) => item.uuid === mesh.uuid)) return;
    const next = [...existing, mesh];
    set({ cutMeshes: next });
    console.log(next);
  },
  print: () => {
    console.log("store");
  },
}));
