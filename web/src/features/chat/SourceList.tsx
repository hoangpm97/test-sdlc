import { ChevronDownIcon, FileTextIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useOpenCitation } from "@/features/pdf-viewer/PdfPanel";
import { cn } from "@/shared/lib/cn";
import type { Citation } from "@/shared/types";

const COLLAPSED_COUNT = 3;

/** Danh sách nguồn dưới câu trả lời; thu gọn khi có hơn 3 nguồn */
export function SourceList({ citations }: { citations: Citation[] }) {
  const openCitation = useOpenCitation();
  const [expanded, setExpanded] = useState(false);
  if (citations.length === 0) return null;

  const shown = expanded ? citations : citations.slice(0, COLLAPSED_COUNT);
  const hidden = citations.length - COLLAPSED_COUNT;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[12px] font-medium tracking-wide text-fg-muted uppercase">Nguồn</p>
      <motion.ul
        className="flex flex-wrap gap-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence initial={false}>
          {shown.map((c) => (
            <motion.li
              key={c.index}
              layout
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <button
                type="button"
                disabled={c.deleted}
                onClick={() => openCitation(c)}
                className={cn(
                  "flex max-w-64 items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-left text-small transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-brand/50 hover:shadow-soft",
                  c.deleted &&
                    "cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-line hover:shadow-none",
                )}
                title={c.deleted ? "Tài liệu đã bị xóa" : c.snippet}
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-brand-soft text-[10px] font-semibold text-brand-soft-fg">
                  {c.index}
                </span>
                <FileTextIcon className="size-3.5 shrink-0 text-fg-muted" />
                <span className={cn("truncate", c.deleted && "line-through")}>{c.fileName}</span>
                <span className="shrink-0 text-fg-muted">tr. {c.page}</span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-small text-brand hover:bg-brand-soft"
            >
              {expanded ? "Thu gọn" : `+${hidden} nguồn khác`}
              <ChevronDownIcon
                className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              />
            </button>
          </li>
        )}
      </motion.ul>
    </div>
  );
}
