import type { Transition, Variants } from "motion/react";

/** Motion tokens – plan mục 4.2 */
export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.25,
  slow: 0.4,
} as const;

export const ease = {
  outSoft: [0.22, 1, 0.36, 1],
  inSoft: [0.64, 0, 0.78, 0],
} as const;

export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  gentle: { type: "spring", stiffness: 200, damping: 26 },
} as const satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.outSoft } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: spring.snappy },
};

export function staggerContainer(stagger = 0.04, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}
