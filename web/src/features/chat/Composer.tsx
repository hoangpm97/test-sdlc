import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/misc";

export const COMPOSER_ID = "chat-composer";
const MAX_LENGTH = 2000;
const MAX_HEIGHT = 8 * 24 + 16; // tối đa 8 dòng

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  remainingQuestions?: number;
  lastQuestion?: string;
}

/** Ô nhập nổi kính mờ, viền gradient khi focus (M19) */
export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  placeholder = "Hỏi bất cứ điều gì về tài liệu của bạn…",
  remainingQuestions,
  lastQuestion,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > MAX_LENGTH;
  const canSend = !disabled && !streaming && value.trim().length > 0 && !tooLong;

  // Tự giãn chiều cao theo nội dung
  // biome-ignore lint/correctness/useExhaustiveDependencies: đo lại chiều cao mỗi khi nội dung đổi
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSend) onSend();
    } else if (event.key === "ArrowUp" && value === "" && lastQuestion) {
      event.preventDefault();
      onChange(lastQuestion);
    } else if (event.key === "Escape" && streaming) {
      onStop();
    }
  }

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div
        className={cn(
          "rounded-[18px] bg-line p-px shadow-float transition-[background] focus-within:ai-gradient",
          disabled && "opacity-70",
        )}
      >
        <div className="glass flex items-end gap-2 rounded-[17px] py-2 pr-2 pl-4">
          <textarea
            id={COMPOSER_ID}
            ref={ref}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Câu hỏi"
            className="scrollbar-thin max-h-[208px] min-h-10 flex-1 resize-none bg-transparent py-2 text-body leading-6 placeholder:text-fg-muted/70 focus:outline-none disabled:cursor-not-allowed"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            {streaming ? (
              <motion.div
                key="stop"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
                  onClick={onStop}
                  aria-label="Dừng (Esc)"
                >
                  <SquareIcon className="fill-current" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                <Button
                  size="icon"
                  className={cn("rounded-full", canSend && "ai-gradient text-white")}
                  disabled={!canSend}
                  onClick={onSend}
                  aria-label="Gửi (Enter)"
                >
                  <ArrowUpIcon />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-2 flex min-h-5 items-center justify-between gap-3 px-2 text-[12px] text-fg-muted">
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>Enter</Kbd> gửi · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> xuống dòng · <Kbd>↑</Kbd> sửa câu
          hỏi trước
        </span>
        <span className="ml-auto flex items-center gap-3">
          {remainingQuestions !== undefined && remainingQuestions < 20 && (
            <span className={cn(remainingQuestions === 0 ? "text-danger" : "text-warning")}>
              Còn {remainingQuestions} câu hỏi hôm nay
            </span>
          )}
          {value.length > 1800 && (
            <span className={cn("tabular-nums", tooLong && "font-medium text-danger")}>
              {value.length.toLocaleString("vi-VN")}/{MAX_LENGTH.toLocaleString("vi-VN")}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
