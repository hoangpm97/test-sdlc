import { Outlet, useMatches, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { lazy, Suspense, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { COMPOSER_ID } from "@/features/chat/Composer";
import { Sidebar } from "@/features/conversations/Sidebar";
import { useUploads } from "@/features/documents/uploadStore";
import { useDocumentEvents } from "@/features/documents/useDocumentEvents";
import { PdfPanel } from "@/features/pdf-viewer/PdfPanel";
import { useHotkeys } from "@/shared/hooks/useHotkeys";
import { Celebration } from "./Celebration";
import { GlobalDropOverlay } from "./GlobalDropOverlay";
import { useUi } from "./uiStore";

// cmdk chỉ tải khi người dùng mở command palette lần đầu
const CommandPalette = lazy(() =>
  import("./CommandPalette").then((m) => ({ default: m.CommandPalette })),
);

/** Khung ứng dụng: sidebar · nội dung chính · panel PDF (plan mục 5.2) */
export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();
  const routeId = matches[matches.length - 1]?.routeId ?? "";
  const isChat = routeId.startsWith("/_app/chat");
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const openFilePicker = useUi((s) => s.openFilePicker);
  const registerFilePicker = useUi((s) => s.registerFilePicker);
  const enqueue = useUploads((s) => s.enqueue);
  const setMobileSidebarOpen = useUi((s) => s.setMobileSidebarOpen);
  const commandOpen = useUi((s) => s.commandOpen);

  useDocumentEvents();

  // biome-ignore lint/correctness/useExhaustiveDependencies: đóng drawer mỗi khi chuyển trang
  useEffect(() => setMobileSidebarOpen(false), [pathname, setMobileSidebarOpen]);

  const announceUpload = useCallback(
    (count: number) => {
      if (count === 0 || pathname === "/documents") return;
      toast(`Đang tải lên ${count} tài liệu`, {
        description: "Bạn sẽ nhận thông báo khi tài liệu sẵn sàng.",
        action: { label: "Xem", onClick: () => void navigate({ to: "/documents" }) },
      });
    },
    [pathname, navigate],
  );

  useHotkeys([
    { key: "k", mod: true, handler: () => setCommandOpen(true) },
    { key: "o", mod: true, shift: true, handler: () => void navigate({ to: "/chat", search: {} }) },
    { key: "u", mod: true, handler: openFilePicker },
    { key: "/", handler: () => document.getElementById(COMPOSER_ID)?.focus() },
  ]);

  // Nhóm route con của chat dùng chung một hiệu ứng chuyển trang
  const transitionKey = isChat ? "chat" : routeId;

  return (
    <div className="flex h-full overflow-hidden">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-3 py-2 text-brand-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Sidebar />
      <main id="main" className="relative flex min-w-0 flex-1 flex-col">
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Outlet />
        </motion.div>
      </main>
      {isChat && <PdfPanel />}

      {/* Input file dùng chung cho nút "Tải lên", Ctrl+U và command palette */}
      <input
        ref={registerFilePicker}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void enqueue(files);
          announceUpload(files.length);
        }}
      />
      <GlobalDropOverlay onUpload={announceUpload} />
      {commandOpen && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
      <Celebration />
    </div>
  );
}
