import "react-pdf/dist/Page/TextLayer.css";
import { useQuery } from "@tanstack/react-query";
import { FileWarningIcon, MinusIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { documentFileQuery } from "@/features/documents/api";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/misc";
import { createHighlightRenderer } from "./highlight";

// Phải cấu hình worker trong cùng module dùng <Document> (theo hướng dẫn react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.15, 1.35, 1.6, 2];
const A4_RATIO = Math.SQRT2; // tỉ lệ khổ A4

export interface PdfViewerProps {
  documentId: string;
  /** Trang cần cuộn tới (trích dẫn) */
  targetPage?: number;
  /** Đoạn văn cần tô sáng trên targetPage */
  highlight?: string | null;
  /** Nội dung bên trái thanh công cụ (tên file, nút đóng…) */
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
}

export default function PdfViewer({
  documentId,
  targetPage,
  highlight,
  toolbarStart,
  toolbarEnd,
}: PdfViewerProps) {
  const file = useQuery(documentFileQuery(documentId));
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [visible, setVisible] = useState<Set<number>>(() => new Set([1]));
  const [currentPage, setCurrentPage] = useState(targetPage ?? 1);

  const scale = ZOOM_STEPS[zoomIndex] ?? 1;
  const pageWidth = Math.max(240, (width - 32) * scale);

  // Theo dõi độ rộng vùng xem để trang PDF co giãn theo panel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Chỉ render các trang gần vùng nhìn thấy (lazy render)
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || numPages === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const page = Number((entry.target as HTMLElement).dataset.page);
            if (entry.isIntersecting) next.add(page);
          }
          return next;
        });
      },
      { root, rootMargin: "800px 0px" },
    );
    const current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setCurrentPage(Number((entry.target as HTMLElement).dataset.page));
        }
      },
      { root, threshold: 0.5 },
    );
    for (const el of pageRefs.current.values()) {
      observer.observe(el);
      current.observe(el);
    }
    return () => {
      observer.disconnect();
      current.disconnect();
    };
  }, [numPages]);

  // Cuộn tới trang của trích dẫn; cuộn lại lần nữa khi trang đích render xong
  // vì vị trí có thể thay đổi trong lúc panel đang trượt vào
  const pendingScroll = useRef<number | null>(null);
  const scrollToPage = useCallback((page: number) => {
    pageRefs.current.get(page)?.scrollIntoView({ block: "start" });
  }, []);
  useEffect(() => {
    if (!targetPage || numPages === 0) return;
    pendingScroll.current = targetPage;
    setVisible((prev) => new Set(prev).add(targetPage));
    requestAnimationFrame(() => scrollToPage(targetPage));
  }, [targetPage, numPages, scrollToPage]);

  const renderer = useMemo(
    () => (highlight ? createHighlightRenderer(highlight) : undefined),
    [highlight],
  );
  const setPageRef = useCallback(
    (page: number) => (el: HTMLDivElement | null) => {
      if (el) pageRefs.current.set(page, el);
      else pageRefs.current.delete(page);
    },
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">{toolbarStart}</div>
        {numPages > 0 && (
          <span className="text-small text-fg-muted tabular-nums" aria-live="polite">
            {currentPage} / {numPages}
          </span>
        )}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Thu nhỏ"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
          >
            <MinusIcon />
          </Button>
          <span className="w-11 text-center text-small text-fg-muted tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Phóng to"
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
          >
            <PlusIcon />
          </Button>
        </div>
        {toolbarEnd}
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-surface-3/60 px-4 py-4"
      >
        {file.isError ? (
          <ViewerError />
        ) : !file.data || width === 0 ? (
          <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-xl" />
        ) : (
          <Document
            file={file.data.url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-xl" />}
            error={<ViewerError />}
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <div
                key={page}
                ref={setPageRef(page)}
                data-page={page}
                className="overflow-hidden rounded-sm bg-white shadow-soft"
                style={{ width: pageWidth, minHeight: pageWidth * A4_RATIO }}
              >
                {visible.has(page) && (
                  <Page
                    pageNumber={page}
                    width={pageWidth}
                    renderAnnotationLayer={false}
                    customTextRenderer={page === targetPage ? renderer : undefined}
                    onRenderTextLayerSuccess={() => {
                      if (pendingScroll.current === page) {
                        pendingScroll.current = null;
                        scrollToPage(page);
                      }
                    }}
                    loading={
                      <Skeleton className="w-full" style={{ height: pageWidth * A4_RATIO }} />
                    }
                  />
                )}
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}

function ViewerError() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-fg-muted">
      <FileWarningIcon className="size-8" />
      <p>Không mở được tài liệu này. Có thể tài liệu đã bị xóa hoặc liên kết đã hết hạn.</p>
    </div>
  );
}
