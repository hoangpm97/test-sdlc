import { toast } from "sonner";
import { create } from "zustand";
import { errorMessage } from "@/shared/lib/api";
import { uploadDocument, upsertDocument } from "./api";
import { MAX_FILES_PER_UPLOAD, validatePdf } from "./validate";

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "error";
  error: string | null;
}

interface UploadState {
  items: UploadItem[];
  enqueue: (files: File[]) => Promise<void>;
  dismiss: (id: string) => void;
}

const CONCURRENCY = 3;
let counter = 0;

export const useUploads = create<UploadState>()((set, get) => {
  const patch = (id: string, change: Partial<UploadItem>) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...change } : i)) }));

  function pump() {
    const { items } = get();
    const active = items.filter((i) => i.status === "uploading").length;
    for (const item of items.filter((i) => i.status === "queued").slice(0, CONCURRENCY - active)) {
      patch(item.id, { status: "uploading" });
      uploadDocument(item.file, (progress) => patch(item.id, { progress }))
        .then((doc) => {
          upsertDocument(doc);
          set((s) => ({ items: s.items.filter((i) => i.id !== item.id) }));
        })
        .catch((error) => patch(item.id, { status: "error", error: errorMessage(error) }))
        .finally(pump);
    }
  }

  return {
    items: [],
    async enqueue(files) {
      if (files.length === 0) return;
      if (files.length > MAX_FILES_PER_UPLOAD) {
        toast.error(`Mỗi lần tải lên tối đa ${MAX_FILES_PER_UPLOAD} file.`, {
          description: `Bạn đã chọn ${files.length} file. Hãy chia thành nhiều lần.`,
        });
        return;
      }
      const prepared = await Promise.all(
        files.map(async (file) => {
          const issue = await validatePdf(file);
          counter += 1;
          return {
            id: `up_${counter}`,
            file,
            progress: 0,
            status: issue ? "error" : "queued",
            error: issue?.message ?? null,
          } satisfies UploadItem;
        }),
      );
      set((s) => ({ items: [...s.items, ...prepared] }));
      pump();
    },
    dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  };
});
