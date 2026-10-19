import { create } from "zustand";

interface PdfHighlightState {
  documentId: string | null;
  page: number | null;
  snippet: string | null;
  setHighlight: (documentId: string, page: number, snippet: string) => void;
  clear: () => void;
}

/** Đoạn trích cần tô sáng – quá dài để đặt trong URL nên giữ trong store */
export const usePdfHighlight = create<PdfHighlightState>()((set) => ({
  documentId: null,
  page: null,
  snippet: null,
  setHighlight: (documentId, page, snippet) => set({ documentId, page, snippet }),
  clear: () => set({ documentId: null, page: null, snippet: null }),
}));
