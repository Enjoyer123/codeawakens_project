// store/useUserStore.js
import { create } from "zustand";

const useUserStore = create((set) => ({
  role: null, // guest / user / admin
  preScore: null,
  postScore: null,
  setRole: (role) => set({ role }),
  setScores: (preScore, postScore) => set({ preScore, postScore }),
}));

export default useUserStore;
