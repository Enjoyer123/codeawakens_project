// store/useUserStore.js
import { create } from "zustand";

const useUserStore = create((set) => ({
  role: null, // guest / user / admin
  setRole: (role) => set({ role }),
}));

export default useUserStore;
