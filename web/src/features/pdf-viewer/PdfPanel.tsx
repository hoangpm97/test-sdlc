import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { FileTextIcon, Maximize2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef } from "react";
import { documentsQuery } from "@/features/documents/api";
import { useHotkeys } from "@/shared/hooks/useHotkeys";
import { spring } from "@/shared/motion/tokens";
import { usePreferences } from "@/shared/stores/preferences";
import type { Citation } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Tooltip } from "@/shared/ui/overlays";
import { LazyPdfViewer } from "./LazyPdfViewer";
import { usePdfHighlight } from "./store";

const MIN_WIDTH = 360;
const MAX_WIDTH = 900;

/** Mở panel PDF tại trang của trích dẫn và tô sáng đoạn trích (FR-25) */
export function useOpenCitation() {
  const navigate = useNavigate();
  const setHighlight = usePdfHighlight((s) => s.setHighlight);
  return useCallback(
    (citation: Citation) => {
      setHighlight(citation.documentId, citation.page, citation.snippet);
      void navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          doc: citation.documentId,
          page: citation.page,
        }),
      });
    },
    [navigate, setHighlight],
  );
}

/** Panel xem PDF trượt vào từ phải (M11), trạng thái đồng bộ với URL (?doc=&page=) */
export function PdfPanel() {
  const search = useSearch({ strict: false }) as { doc?: string; page?: number };
  const navigate = useNavigate();
  const documents = useQuery(documentsQuery);
  const highlight = usePdfHighlight();
  const width = usePreferences((s) => s.pdfPanelWidth);
  const setWidth = usePreferences((s) => s.setPdfPanelWidth);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  const doc = documents.data?.find((d) => d.id === search.doc);
  const open = Boolean(search.doc);

  const close = useCallback(() => {
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, doc: undefined, page: undefined }),
    });
  }, [navigate]);

  useHotkeys([{ key: "Escape", allowInInput: true, handler: () => open && close() }]);

  function onPointerDown(event: React.PointerEvent) {
    dragStart.current = { x: event.clientX, width };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: React.PointerEvent) {
    if (!dragStart.current) return;
    const next = dragStart.current.width + (dragStart.current.x - event.clientX);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
  }

  const snippet =
    highlight.documentId === search.doc && highlight.page === search.page
      ? highlight.snippet
      : null;

  return (
    <AnimatePresence>
      {open && search.doc && (
        <motion.aside
          key="pdf-panel"
          aria-label="Xem tài liệu"
          initial={{ x: "100%", opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{
            x: "100%",
            opacity: 0.6,
            transition: { duration: 0.2, ease: [0.64, 0, 0.78, 0] },
          }}
          transition={spring.gentle}
          style={{ width }}
          className="fixed inset-y-0 right-0 z-30 flex max-w-full shrink-0 flex-col border-l border-line bg-surface shadow-float xl:relative xl:shadow-none"
        >
          {/* Tay nắm kéo để đổi độ rộng */}
          {/* biome-ignore lint/a11y/useSemanticElements: thanh kéo đổi độ rộng, không phải đường phân cách tĩnh */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Kéo để đổi độ rộng"
            className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize transition-colors hover:bg-brand/20"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => {
              dragStart.current = null;
            }}
          />
          <LazyPdfViewer
            key={search.doc}
            documentId={search.doc}
            targetPage={search.page}
            highlight={snippet}
            toolbarStart={
              <>
                <FileTextIcon className="size-4 shrink-0 text-brand" />
                <span className="truncate text-small font-medium" title={doc?.fileName}>
                  {doc?.fileName ?? "Tài liệu"}
                </span>
              </>
            }
            toolbarEnd={
              <>
                <Tooltip content="Mở toàn màn hình">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      to="/documents/$documentId"
                      params={{ documentId: search.doc }}
                      aria-label="Mở toàn màn hình"
                    >
                      <Maximize2Icon />
                    </Link>
                  </Button>
                </Tooltip>
                <Tooltip content="Đóng (Esc)">
                  <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Đóng">
                    <XIcon />
                  </Button>
                </Tooltip>
              </>
            }
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
