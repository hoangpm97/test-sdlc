import { MenuIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useUi } from "@/app/uiStore";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";

/** Thanh tiêu đề dính trên cùng, hiệu ứng kính mờ (plan mục 3.2) */
export function PageHeader({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const openSidebar = useUi((s) => s.setMobileSidebarOpen);
  return (
    <header
      className={cn(
        "glass sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line/70 px-4 md:px-6",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Mở menu"
        onClick={() => openSidebar(true)}
      >
        <MenuIcon />
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
