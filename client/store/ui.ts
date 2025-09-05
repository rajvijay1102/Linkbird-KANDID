import { create } from "zustand";
import { LeadStatus } from "@shared/api";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  leads: {
    q: string;
    status: LeadStatus | "all";
    setQ: (q: string) => void;
    setStatus: (s: LeadStatus | "all") => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  leads: {
    q: "",
    status: "all",
    setQ: (q: string) => set((s) => ({ leads: { ...s.leads, q } })),
    setStatus: (status: LeadStatus | "all") => set((s) => ({ leads: { ...s.leads, status } })),
  },
}));
