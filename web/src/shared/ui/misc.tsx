import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div aria-hidden className={cn("shimmer-bg rounded-md bg-surface-3", className)} {...props} />
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-line bg-surface-2 px-1 font-sans text-[11px] font-medium text-fg-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-fg-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small font-medium [&_svg]:size-3.5",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Avatar đại diện cho AI – vòng gradient xoay khi đang suy nghĩ (M7) */
export function AiAvatar({ thinking = false, size = 28 }: { thinking?: boolean; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {thinking && (
        <span className="absolute -inset-[3px] animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,var(--ai-from),var(--ai-to),transparent_70%,var(--ai-from))] opacity-80" />
      )}
      <span className="ai-gradient relative flex size-full items-center justify-center rounded-full text-white shadow-soft">
        <svg viewBox="0 0 24 24" className="size-[55%]" fill="currentColor" aria-hidden>
          <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" />
        </svg>
      </span>
    </span>
  );
}

/** Ba chấm nhảy khi AI đang tìm kiếm (M7) */
export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-fg-muted"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="ai-gradient flex size-8 items-center justify-center rounded-[9px] text-white shadow-soft">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
            fill="currentColor"
            opacity=".95"
          />
          <path
            d="M8.5 12h6M8.5 15.5h4"
            stroke="var(--brand)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold">Chat với tài liệu</span>
          <span className="block text-[11px] text-fg-muted">Trợ lý tra cứu cho đội BD</span>
        </span>
      )}
    </span>
  );
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
}: {
  illustration: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-sm flex-col items-center py-16 text-center"
    >
      {illustration}
      <h2 className="mt-6 text-title font-semibold">{title}</h2>
      <p className="mt-2 text-fg-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
