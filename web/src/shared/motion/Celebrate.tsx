import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

interface CelebrateProps {
  /** Số hạt */
  count?: number;
  /** Bán kính bay ra (px) */
  radius?: number;
  className?: string;
}

const COLORS = [
  "var(--ai-from)",
  "var(--ai-to)",
  "var(--brand)",
  "var(--success)",
  "var(--warning)",
];

/**
 * Hiệu ứng hạt bung ra từ tâm (M5, M13).
 * Đặt trong một phần tử `relative`. Không render gì khi người dùng giảm chuyển động.
 */
export function Celebrate({ count = 14, radius = 56, className }: CelebrateProps) {
  const reduced = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = radius * (0.6 + Math.random() * 0.5);
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 4 + Math.random() * 4,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.08,
        };
      }),
    [count, radius],
  );

  if (reduced) return null;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ""}`}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </span>
  );
}
