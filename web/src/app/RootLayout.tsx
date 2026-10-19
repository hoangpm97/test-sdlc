import { Link, Outlet } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { resolveDark, usePreferences } from "@/shared/stores/preferences";
import { Button } from "@/shared/ui/button";
import { NotFoundIllustration } from "@/shared/ui/illustrations";
import { EmptyState } from "@/shared/ui/misc";
import { TooltipProvider } from "@/shared/ui/overlays";
import { Toaster } from "@/shared/ui/toaster";

export function RootLayout() {
  const theme = usePreferences((s) => s.theme);
  const reduceMotion = usePreferences((s) => s.reduceMotion);

  // Áp dụng giao diện sáng/tối và theo dõi thay đổi của hệ thống
  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle("dark", resolveDark(theme));
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <TooltipProvider delayDuration={300}>
        <Outlet />
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <EmptyState
        illustration={<NotFoundIllustration />}
        title="Không tìm thấy trang"
        description="Đường dẫn có thể đã thay đổi hoặc không còn tồn tại."
        action={
          <Button asChild>
            <Link to="/chat">Về trang chính</Link>
          </Button>
        }
      />
    </div>
  );
}
