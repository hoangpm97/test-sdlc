import { CloudUploadIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "motion/react";
import { useDropzone } from "react-dropzone";
import { modKey } from "@/shared/hooks/useHotkeys";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/misc";
import { useUploads } from "./uploadStore";

/** Vùng tải lên: "thở" nhẹ + viền nét đứt chạy khi kéo file vào (M1) */
export function Dropzone({ compact = false }: { compact?: boolean }) {
  const enqueue = useUploads((s) => s.enqueue);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => void enqueue(files),
    noClick: true,
    multiple: true,
    // Thả ngoài vùng này do GlobalDropOverlay xử lý
    preventDropOnDocument: false,
  });

  return (
    <motion.div
      {...(getRootProps() as object)}
      animate={{ scale: isDragActive ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-surface-2 text-center transition-colors",
        compact ? "px-6 py-6" : "px-6 py-10",
        isDragActive && "marching-border border-transparent bg-brand-soft",
      )}
    >
      <input {...getInputProps()} aria-label="Chọn file PDF" />
      <motion.div
        animate={isDragActive ? { y: [0, -8, 0] } : { y: 0 }}
        transition={isDragActive ? { duration: 0.8, repeat: Number.POSITIVE_INFINITY } : {}}
        className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand"
      >
        <CloudUploadIcon className="size-6" />
      </motion.div>
      <p className="mt-3 font-medium">
        {isDragActive ? "Thả file vào đây để tải lên" : "Kéo-thả file PDF vào đây"}
      </p>
      <p className="mt-1 text-small text-fg-muted">
        Tối đa 10 file mỗi lần · mỗi file ≤ 50 MB và ≤ 500 trang
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={open} size="sm">
          Chọn file
        </Button>
        <span className="hidden items-center gap-1 text-small text-fg-muted sm:flex">
          hoặc nhấn <Kbd>{modKey}</Kbd>
          <Kbd>U</Kbd>
        </span>
      </div>
      {/* Lời nhắc chính sách phân loại dữ liệu (SP-01) */}
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-fg-muted">
        <ShieldCheckIcon className="size-3.5 text-success" />
        Không tải lên tài liệu mức <strong className="font-medium text-fg">Tuyệt mật</strong> theo
        chính sách bảo mật.
      </p>
    </motion.div>
  );
}
