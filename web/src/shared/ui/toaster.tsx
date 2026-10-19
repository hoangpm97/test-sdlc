import { Toaster as Sonner } from "sonner";
import { resolveDark, usePreferences } from "@/shared/stores/preferences";

export function Toaster() {
  const theme = usePreferences((s) => s.theme);
  return (
    <Sonner
      theme={resolveDark(theme) ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border-line !bg-surface !text-fg !shadow-float !font-sans !text-small",
          description: "!text-fg-muted",
          actionButton: "!bg-brand !text-brand-fg !font-medium",
        },
      }}
    />
  );
}
