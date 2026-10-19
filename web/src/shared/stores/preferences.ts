import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface PreferencesState {
  theme: Theme;
  /** Người dùng chủ động bật "Giảm chuyển động" (plan mục 13, rủi ro 1) */
  reduceMotion: boolean;
  sidebarCollapsed: boolean;
  pdfPanelWidth: number;
  setTheme: (theme: Theme) => void;
  setReduceMotion: (value: boolean) => void;
  toggleSidebar: () => void;
  setPdfPanelWidth: (width: number) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      reduceMotion: false,
      sidebarCollapsed: false,
      pdfPanelWidth: 520,
      setTheme: (theme) => set({ theme }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPdfPanelWidth: (pdfPanelWidth) => set({ pdfPanelWidth }),
    }),
    {
      name: "cwd.preferences",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function resolveDark(theme: Theme): boolean {
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark";
}
