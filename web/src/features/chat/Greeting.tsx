import { BookOpenIcon, LightbulbIcon, ListChecksIcon, SparklesIcon } from "lucide-react";
import { motion } from "motion/react";
import { givenName, greeting } from "@/shared/lib/format";
import { fadeUp, staggerContainer } from "@/shared/motion/tokens";
import { AiAvatar, Skeleton } from "@/shared/ui/misc";

const ICONS = [BookOpenIcon, LightbulbIcon, ListChecksIcon, SparklesIcon];

interface GreetingProps {
  fullName: string;
  readyCount: number;
  suggestions: string[] | undefined;
  onPick: (question: string) => void;
}

/** Lời chào xuất hiện từng chữ + câu hỏi gợi ý stagger (M18, FR-27) */
export function Greeting({ fullName, readyCount, suggestions, onPick }: GreetingProps) {
  const title = `${greeting()}, ${givenName(fullName)}`;
  const letters = Array.from(title);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-4 py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <AiAvatar size={44} />
      </motion.div>
      <h1 className="mt-5 text-display font-semibold tracking-tight" aria-label={title}>
        {letters.map((ch, i) => (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: ký tự có thể lặp lại, vị trí là khóa ổn định
            key={i}
            aria-hidden
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15 + i * 0.022, duration: 0.3 }}
          >
            {ch}
          </motion.span>
        ))}
        <motion.span
          aria-hidden
          className="ml-2 inline-block origin-[70%_70%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: [0, 18, -8, 14, 0] }}
          transition={{ delay: 0.2 + letters.length * 0.022, duration: 0.9 }}
        >
          👋
        </motion.span>
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-title text-fg-muted"
      >
        Bạn có <span className="ai-gradient-text font-semibold">{readyCount} tài liệu</span> sẵn
        sàng. Hôm nay bạn muốn tìm gì?
      </motion.p>

      <motion.div
        variants={staggerContainer(0.07, 0.6)}
        initial="hidden"
        animate="show"
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        {suggestions === undefined
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px] rounded-lg" />)
          : suggestions.map((q, i) => {
              const Icon = ICONS[i % ICONS.length] ?? SparklesIcon;
              return (
                <motion.button
                  key={q}
                  type="button"
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPick(q)}
                  className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-4 text-left shadow-soft transition-colors hover:border-brand/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-small leading-relaxed">{q}</span>
                </motion.button>
              );
            })}
      </motion.div>
    </div>
  );
}
