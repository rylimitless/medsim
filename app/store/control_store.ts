import { create } from "zustand";

const initialState = { rotating: false };

type Control = typeof initialState & {
  setRotating: (value: boolean) => void;
  print: () => void;
};

export const useControlStore = create<Control>((set, get) => ({
  ...initialState,
  setRotating: (value) => set({ rotating: value }),
  print: () => {
    console.log("store");
  },
}));
