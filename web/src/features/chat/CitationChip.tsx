import { FileTextIcon } from "lucide-react";
import { motion } from "motion/react";
import { useOpenCitation } from "@/features/pdf-viewer/PdfPanel";
import { cn } from "@/shared/lib/cn";
import { markSeen } from "@/shared/motion/onceFlags";
import { spring } from "@/shared/motion/tokens";
import type { Citation } from "@/shared/types";
import { HoverCard, HoverCardContent, HoverCardTrigger, Tooltip } from "@/shared/ui/overlays";

const chipBase =
  "mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 align-[2px] text-[11px] font-semibold leading-none tabular-nums";

/** Chip trích dẫn [n]: pop-in (M9), hover xem nhanh (M10), nhấp mở đúng trang (M11) */
export function CitationChip({
  index,
  citation,
}: {
  index: number;
  citation: Citation | null | undefined;
}) {
  const openCitation = useOpenCitation();

  if (!citation) {
    // Đang stream, chưa có dữ liệu nguồn
    return <span className={cn(chipBase, "shimmer-bg bg-surface-3 text-fg-muted")}>{index}</span>;
  }

  if (citation.deleted) {
    return (
      <Tooltip content="Tài liệu đã bị xóa">
        <button
          type="button"
          aria-disabled
          aria-label={`Nguồn ${index}: tài liệu đã bị xóa`}
          className={cn(chipBase, "cursor-not-allowed bg-surface-3 text-fg-muted line-through")}
        >
          {index}
        </button>
      </Tooltip>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.button
          type="button"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.snappy, delay: (index - 1) * 0.05 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            markSeen("first-citation-tip");
            openCitation(citation);
          }}
          className={cn(
            chipBase,
            "cursor-pointer bg-brand-soft text-brand-soft-fg hover:bg-brand hover:text-brand-fg",
          )}
          aria-label={`Nguồn ${index}: ${citation.fileName}, trang ${citation.page}`}
        >
          {index}
        </motion.button>
      </HoverCardTrigger>
      <HoverCardContent side="top">
        <div className="flex items-center gap-2 text-small">
          <FileTextIcon className="size-4 shrink-0 text-brand" />
          <span className="truncate font-medium">{citation.fileName}</span>
          <span className="ml-auto shrink-0 text-fg-muted">tr. {citation.page}</span>
        </div>
        <blockquote className="mt-2 border-l-2 border-brand/50 pl-3 text-small leading-relaxed text-fg/85">
          {citation.snippet}
        </blockquote>
        <p className="mt-2 text-[11px] text-fg-muted">Nhấp để mở đúng trang trong tài liệu</p>
      </HoverCardContent>
    </HoverCard>
  );
}
