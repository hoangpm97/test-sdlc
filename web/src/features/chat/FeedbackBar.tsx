import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { sendFeedback } from "@/features/conversations/api";
import { errorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Celebrate } from "@/shared/motion/Celebrate";
import type { Citation, Feedback, Message } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Tooltip } from "@/shared/ui/overlays";

interface FeedbackBarProps {
  message: Message;
}

function toMarkdown(content: string, citations: Citation[]): string {
  if (citations.length === 0) return content;
  const sources = citations.map((c) => `[${c.index}] ${c.fileName}, trang ${c.page}`).join("\n");
  return `${content}\n\nNguồn:\n${sources}`;
}

/** 👍 nảy + hạt bay ra (M13), 👎 mở ô góp ý (M14), sao chép Markdown (FR-28) */
export function FeedbackBar({ message }: FeedbackBarProps) {
  const queryClient = useQueryClient();
  const [burst, setBurst] = useState(0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);
  const rating = message.feedback?.rating ?? null;

  async function submit(feedback: Feedback) {
    const key = ["messages", message.conversationId];
    const previous = queryClient.getQueryData<Message[]>(key);
    queryClient.setQueryData<Message[]>(key, (list) =>
      list?.map((m) => (m.id === message.id ? { ...m, feedback } : m)),
    );
    try {
      await sendFeedback(message.id, feedback);
    } catch (error) {
      queryClient.setQueryData(key, previous);
      toast.error("Không gửi được đánh giá", { description: errorMessage(error) });
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(toMarkdown(message.content, message.citations));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-0.5 text-fg-muted opacity-70 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
        <Tooltip content="Câu trả lời hữu ích">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Hữu ích"
            aria-pressed={rating === 1}
            className={cn("relative", rating === 1 && "text-success")}
            onClick={() => {
              setCommentOpen(false);
              if (rating !== 1) setBurst((b) => b + 1);
              void submit({ rating: 1 });
            }}
          >
            <motion.span
              key={burst}
              animate={burst ? { scale: [1, 1.45, 1], rotate: [0, -14, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <ThumbsUpIcon className={cn(rating === 1 && "fill-current")} />
            </motion.span>
            {burst > 0 && <Celebrate key={burst} count={8} radius={22} />}
          </Button>
        </Tooltip>
        <Tooltip content="Chưa chính xác">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Chưa chính xác"
            aria-pressed={rating === -1}
            className={cn(rating === -1 && "text-danger")}
            onClick={() => {
              setCommentOpen(true);
              void submit({ rating: -1, comment: message.feedback?.comment });
            }}
          >
            <ThumbsDownIcon className={cn(rating === -1 && "fill-current")} />
          </Button>
        </Tooltip>
        <Tooltip content={copied ? "Đã sao chép" : "Sao chép (Markdown)"}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sao chép câu trả lời"
            onClick={() => void copy()}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? "ok" : "copy"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {commentOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              void submit({ rating: -1, comment: comment.trim() || undefined });
              setCommentOpen(false);
              toast.success("Cảm ơn góp ý của bạn!", {
                description: "Đội phát triển sẽ dùng góp ý này để cải thiện câu trả lời.",
              });
            }}
          >
            <div className="mt-2 rounded-md border border-line bg-surface-2 p-3">
              <label htmlFor={`fb-${message.id}`} className="text-small font-medium">
                Câu trả lời chưa đúng ở đâu?{" "}
                <span className="font-normal text-fg-muted">(không bắt buộc)</span>
              </label>
              <textarea
                id={`fb-${message.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={2}
                className="mt-2 w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-small focus-visible:border-brand focus-visible:outline-none"
                placeholder="Ví dụ: thiếu điều khoản phạt, trích nhầm trang…"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <span className="mr-auto text-[12px] text-fg-muted tabular-nums">
                  {comment.length}/500
                </span>
                <Button variant="ghost" size="sm" onClick={() => setCommentOpen(false)}>
                  Bỏ qua
                </Button>
                <Button type="submit" size="sm">
                  Gửi góp ý
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
