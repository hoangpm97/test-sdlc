import { AlertCircleIcon, FileTextIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatBytes } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useUploads } from "./uploadStore";

/** Thẻ file đang tải lên bay vào lần lượt (M2), mỗi file có tiến trình riêng (FR-08, FR-09) */
export function UploadQueue() {
  const items = useUploads((s) => s.items);
  const dismiss = useUploads((s) => s.dismiss);

  return (
    <ul className="space-y-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { delay: i * 0.04, duration: 0.25 },
            }}
            exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
            className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5"
          >
            <span className={item.status === "error" ? "text-danger" : "text-brand"}>
              {item.status === "error" ? (
                <AlertCircleIcon className="size-5" />
              ) : (
                <FileTextIcon className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-small font-medium">{item.file.name}</p>
                <span className="shrink-0 text-[12px] text-fg-muted tabular-nums">
                  {item.status === "error"
                    ? formatBytes(item.file.size)
                    : item.status === "queued"
                      ? "Đang chờ…"
                      : `Đang tải lên ${item.progress}%`}
                </span>
              </div>
              {item.status === "error" ? (
                <p className="mt-0.5 text-[12px] text-danger">{item.error}</p>
              ) : (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="ai-gradient h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(item.progress, 4)}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
            {item.status === "error" && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Bỏ qua"
                onClick={() => dismiss(item.id)}
              >
                <XIcon />
              </Button>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
