import { Link } from "@tanstack/react-router";
import {
  CircleAlertIcon,
  CopyIcon,
  FolderOpenIcon,
  LayersIcon,
  LightbulbIcon,
  RotateCcwIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { hasSeen, markSeen } from "@/shared/motion/onceFlags";
import type { Citation, Message } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { SearchMissIllustration } from "@/shared/ui/illustrations";
import { AiAvatar, TypingDots } from "@/shared/ui/misc";
import { Tooltip } from "@/shared/ui/overlays";
import { FeedbackBar } from "./FeedbackBar";
import { Markdown } from "./Markdown";
import { SourceList } from "./SourceList";
import type { StreamStatus } from "./streamStore";

/** Bubble câu hỏi bay lên từ ô nhập (M6) */
export function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="group/user flex justify-end gap-2"
    >
      <Tooltip content="Sao chép">
        <Button
          variant="ghost"
          size="icon-sm"
          className="mt-1 opacity-0 transition-opacity group-hover/user:opacity-100 focus-visible:opacity-100"
          aria-label="Sao chép câu hỏi"
          onClick={() => void navigator.clipboard.writeText(content)}
        >
          <CopyIcon />
        </Button>
      </Tooltip>
      <div className="max-w-[85%] rounded-lg rounded-br-sm bg-brand-soft px-4 py-2.5 whitespace-pre-wrap text-brand-soft-fg">
        {content}
      </div>
    </motion.div>
  );
}

interface AssistantMessageProps {
  content: string;
  citations: Citation[] | null;
  status: StreamStatus;
  notFound?: boolean;
  documentCount?: number;
  error?: { code: string; message: string } | null;
  message?: Message;
  isLatest?: boolean;
  scopeLimited?: boolean;
  onRetry?: () => void;
  onClearScope?: () => void;
}

export function AssistantMessage({
  content,
  citations,
  status,
  notFound,
  documentCount = 0,
  error,
  message,
  isLatest,
  scopeLimited,
  onRetry,
  onClearScope,
}: AssistantMessageProps) {
  const thinking = status === "searching" || status === "streaming";
  const [tipOpen, setTipOpen] = useState(() =>
    Boolean(isLatest && citations && citations.length > 0 && !hasSeen("first-citation-tip")),
  );

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="group/msg flex gap-3"
    >
      <div className="pt-0.5">
        <AiAvatar thinking={thinking} />
      </div>
      <div className="min-w-0 flex-1">
        {status === "searching" ? (
          <div className="flex h-7 items-center gap-3" role="status">
            <span className="shimmer-text text-small font-medium">
              Đang tìm trong {documentCount > 0 ? `${documentCount} ` : ""}tài liệu…
            </span>
            <TypingDots />
          </div>
        ) : notFound ? (
          <NotFoundAnswer
            content={content}
            scopeLimited={scopeLimited}
            onClearScope={onClearScope}
          />
        ) : (
          content && (
            <Markdown content={content} citations={citations} streaming={status === "streaming"} />
          )
        )}

        {status === "error" && error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-2 flex items-start gap-3 rounded-md border border-danger/30 bg-danger/8 p-3 text-small"
          >
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" />
            <p className="flex-1">{error.message}</p>
            {onRetry && error.code !== "E-11" && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcwIcon /> Thử lại
              </Button>
            )}
          </motion.div>
        )}

        {(status === "stopped" || message?.stopped) && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-0.5 text-[12px] text-fg-muted">
            <SquareIcon className="size-2.5 fill-current" /> Đã dừng
          </p>
        )}

        {!notFound && citations && citations.length > 0 && <SourceList citations={citations} />}

        {/* Điểm chạm onboarding #3: mẹo về trích dẫn, chỉ hiện một lần */}
        <AnimatePresence>
          {tipOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="mt-3 flex items-start gap-2.5 rounded-md border border-brand/30 bg-brand-soft/60 p-3 text-small text-brand-soft-fg"
            >
              <LightbulbIcon className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1">
                <strong className="font-semibold">Mẹo:</strong> nhấp vào số trích dẫn như{" "}
                <span className="rounded-[4px] bg-brand px-1 text-[11px] font-semibold text-brand-fg">
                  1
                </span>{" "}
                để mở đúng đoạn gốc trong tài liệu và kiểm chứng.
              </p>
              <button
                type="button"
                aria-label="Đã hiểu"
                className="rounded-sm p-0.5 hover:bg-brand/10"
                onClick={() => {
                  markSeen("first-citation-tip");
                  setTipOpen(false);
                }}
              >
                <XIcon className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {message && status === "done" && <FeedbackBar message={message} />}
      </div>
    </motion.div>
  );
}

/** Trạng thái "không tìm thấy" thân thiện, không giống lỗi (M12, BR-10) */
function NotFoundAnswer({
  content,
  scopeLimited,
  onClearScope,
}: {
  content: string;
  scopeLimited?: boolean;
  onClearScope?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-2 p-4">
      <div className="flex gap-3">
        <SearchMissIllustration />
        <div className="flex-1">
          <p className="font-medium">Không tìm thấy thông tin trong tài liệu</p>
          <p className="mt-1 text-small text-fg-muted">{content}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
        {scopeLimited && onClearScope && (
          <Button size="sm" variant="soft" className={cn("rounded-full")} onClick={onClearScope}>
            <LayersIcon /> Hỏi trên tất cả tài liệu
          </Button>
        )}
        <Button size="sm" variant="outline" className="rounded-full" asChild>
          <Link to="/documents">
            <FolderOpenIcon /> Xem danh sách tài liệu
          </Link>
        </Button>
      </div>
    </div>
  );
}
