import { create } from "zustand";

type Mode = "light" | "dark";

interface ThemeState {
  mode: Mode;
  toggle: () => void;
}

const stored = localStorage.getItem("theme-mode") as Mode | null;

export const useThemeStore = create<ThemeState>((set) => ({
  mode: stored ?? "dark",
  toggle: () =>
    set((s) => {
      const next = s.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", next);
      return { mode: next };
    }),
}));
