import { CloudUploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useUploads } from "@/features/documents/uploadStore";

/** Thả file vào bất kỳ đâu trong ứng dụng để tải lên (plan mục 6.4) */
export function GlobalDropOverlay({ onUpload }: { onUpload: (count: number) => void }) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const enqueue = useUploads((s) => s.enqueue);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    function onEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth.current += 1;
      setActive(true);
    }
    function onLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    }
    function onOver(e: DragEvent) {
      if (hasFiles(e)) e.preventDefault();
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth.current = 0;
      setActive(false);
      // Vùng Dropzone trên trang Tài liệu tự xử lý sự kiện của nó
      if (e.defaultPrevented) return;
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files ?? []);
      void enqueue(files);
      onUpload(files.length);
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [enqueue, onUpload]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-brand/10 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="marching-border flex h-full w-full flex-col items-center justify-center rounded-lg bg-surface/80"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
              className="ai-gradient flex size-16 items-center justify-center rounded-full text-white shadow-float"
            >
              <CloudUploadIcon className="size-8" />
            </motion.div>
            <p className="mt-4 text-title font-semibold">Thả để tải lên</p>
            <p className="mt-1 text-fg-muted">File PDF, tối đa 10 file mỗi lần</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
