import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { suggestionsQuery } from "@/features/conversations/api";
import { Celebrate } from "@/shared/motion/Celebrate";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/misc";
import { useUi } from "./uiStore";

/** Khoảnh khắc "aha" khi tài liệu đầu tiên sẵn sàng (M5) – chỉ xuất hiện một lần */
export function Celebration() {
  const doc = useUi((s) => s.celebration);
  const close = useUi((s) => s.celebrate);
  const setPendingQuestion = useUi((s) => s.setPendingQuestion);
  const navigate = useNavigate();
  const suggestions = useQuery({
    ...suggestionsQuery(doc ? [doc.id] : null),
    enabled: Boolean(doc),
  });

  function ask(question: string) {
    if (!doc) return;
    close(null);
    setPendingQuestion(question);
    void navigate({ to: "/chat", search: { scope: doc.id } });
  }

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          role="dialog"
          aria-label="Tài liệu đầu tiên đã sẵn sàng"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        >
          <div className="relative rounded-[18px] p-px ai-gradient shadow-float">
            <div className="relative rounded-[17px] bg-surface p-5">
              <Celebrate count={22} radius={140} />
              <button
                type="button"
                onClick={() => close(null)}
                className="absolute top-3 right-3 rounded-full p-1 text-fg-muted hover:bg-surface-3"
                aria-label="Đóng"
              >
                <XIcon className="size-4" />
              </button>
              <p className="text-2xl" aria-hidden>
                🎉
              </p>
              <h2 className="mt-1 text-title font-semibold">Bạn đã sẵn sàng!</h2>
              <p className="mt-1 text-small text-fg-muted">
                “{doc.fileName}” đã được xử lý xong. Thử hỏi ngay:
              </p>
              <div className="mt-4 space-y-2">
                {suggestions.data
                  ? suggestions.data.suggestions.slice(0, 3).map((q, i) => (
                      <motion.div
                        key={q}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                      >
                        <Button
                          variant="outline"
                          className="group h-auto w-full justify-between py-2.5 text-left text-small whitespace-normal"
                          onClick={() => ask(q)}
                        >
                          {q}
                          <ArrowRightIcon className="text-brand transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </motion.div>
                    ))
                  : [0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
