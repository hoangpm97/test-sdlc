import { motion } from "motion/react";

/**
 * Minh họa line-art đơn sắc theo màu brand (plan mục 3.2).
 * Dùng SVG + Motion thay cho file Lottie để không phụ thuộc asset bên ngoài.
 */

export function DocumentsIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden>
      <ellipse cx="80" cy="108" rx="52" ry="6" fill="var(--surface-3)" />
      {[
        { x: 30, r: -10, d: 0 },
        { x: 82, r: 8, d: 0.15 },
        { x: 56, r: 0, d: 0.3 },
      ].map((p) => (
        <motion.g
          key={p.x}
          initial={{ y: 20, opacity: 0, rotate: p.r }}
          animate={{ y: [0, -5, 0], opacity: 1, rotate: p.r }}
          transition={{
            y: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: p.d },
            opacity: { duration: 0.4, delay: p.d },
          }}
          style={{ originX: `${p.x + 24}px`, originY: "60px" }}
        >
          <rect
            x={p.x}
            y="24"
            width="48"
            height="64"
            rx="6"
            fill="var(--surface)"
            stroke="var(--brand)"
            strokeWidth="2"
          />
          <path
            d={`M${p.x + 10} 44h28M${p.x + 10} 54h22M${p.x + 10} 64h26`}
            stroke="var(--brand)"
            strokeOpacity=".35"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
      ))}
      <motion.circle
        cx="128"
        cy="26"
        r="10"
        fill="var(--ai-from)"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
      />
      <path d="M128 20l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#fff" />
    </svg>
  );
}

/** Kính lúp lắc nhẹ cho trạng thái "không tìm thấy" (M12) */
export function SearchMissIllustration({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="animate-wiggle origin-[60%_60%]"
    >
      <circle
        cx="20"
        cy="20"
        r="12"
        stroke="var(--brand)"
        strokeWidth="3"
        fill="var(--brand-soft)"
      />
      <path d="M29 29l10 10" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M16 17l8 6M24 17l-8 6"
        stroke="var(--brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotFoundIllustration() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden>
      <text
        x="90"
        y="80"
        textAnchor="middle"
        fontSize="72"
        fontWeight="700"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth="2"
      >
        404
      </text>
    </svg>
  );
}
