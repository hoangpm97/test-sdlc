import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Khai báo các cỡ chữ tùy biến (text-display/title/body/small) để tailwind-merge
 * không nhầm chúng là màu chữ và xóa mất class màu như text-brand-fg.
 * Tương tự với các token màu và shadow/radius riêng của design system.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "title", "body", "small"],
      color: [
        "surface",
        "surface-2",
        "surface-3",
        "line",
        "fg",
        "fg-muted",
        "brand",
        "brand-fg",
        "brand-soft",
        "brand-soft-fg",
        "success",
        "warning",
        "danger",
        "highlight",
        "ai-from",
        "ai-to",
      ],
      shadow: ["soft", "float"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
