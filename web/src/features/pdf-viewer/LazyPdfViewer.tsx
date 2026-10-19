import { lazy, Suspense } from "react";
import { Skeleton } from "@/shared/ui/misc";
import type { PdfViewerProps } from "./PdfViewer";

/** react-pdf + PDF.js là phần nặng nhất – chỉ tải khi cần (plan mục 9) */
const PdfViewer = lazy(() => import("./PdfViewer"));

export function LazyPdfViewer(props: PdfViewerProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-xl" />
        </div>
      }
    >
      <PdfViewer {...props} />
    </Suspense>
  );
}
