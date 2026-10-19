import { useEffect, useRef } from "react";

export interface Hotkey {
  /** Phím theo KeyboardEvent.key, không phân biệt hoa thường: "k", "/", "Escape" */
  key: string;
  /** Ctrl trên Windows/Linux, ⌘ trên macOS */
  mod?: boolean;
  shift?: boolean;
  /** Cho phép kích hoạt khi đang gõ trong ô nhập */
  allowInInput?: boolean;
  handler: (event: KeyboardEvent) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useHotkeys(hotkeys: Hotkey[]) {
  const ref = useRef(hotkeys);
  ref.current = hotkeys;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      for (const hk of ref.current) {
        const mod = event.ctrlKey || event.metaKey;
        if (event.key.toLowerCase() !== hk.key.toLowerCase()) continue;
        if (Boolean(hk.mod) !== mod) continue;
        if (Boolean(hk.shift) !== event.shiftKey) continue;
        if (!hk.allowInInput && !hk.mod && isTypingTarget(event.target)) continue;
        event.preventDefault();
        hk.handler(event);
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? "⌘" : "Ctrl";
