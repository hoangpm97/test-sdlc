import { create } from "zustand";
import type { DocumentItem } from "@/shared/types";

interface UiState {
  commandOpen: boolean;
  mobileSidebarOpen: boolean;
  /** Khoảnh khắc "tài liệu đầu tiên sẵn sàng" (M5) */
  celebration: DocumentItem | null;
  /** Câu hỏi chờ gửi khi người dùng chọn gợi ý từ nơi khác (M5, command palette) */
  pendingQuestion: string | null;
  filePicker: HTMLInputElement | null;
  setCommandOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  celebrate: (doc: DocumentItem | null) => void;
  setPendingQuestion: (question: string | null) => void;
  registerFilePicker: (input: HTMLInputElement | null) => void;
  openFilePicker: () => void;
}

export const useUi = create<UiState>()((set, get) => ({
  commandOpen: false,
  mobileSidebarOpen: false,
  celebration: null,
  pendingQuestion: null,
  filePicker: null,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  celebrate: (celebration) => set({ celebration }),
  setPendingQuestion: (pendingQuestion) => set({ pendingQuestion }),
  registerFilePicker: (filePicker) => set({ filePicker }),
  openFilePicker: () => get().filePicker?.click(),
}));
