import { useEffect } from "react";
import { toast } from "sonner";
import { queryClient } from "@/app/queryClient";
import { useUi } from "@/app/uiStore";
import { errorText } from "@/shared/i18n/errors";
import { apiFetch } from "@/shared/lib/api";
import { readSse } from "@/shared/lib/sse";
import { hasSeen, markSeen } from "@/shared/motion/onceFlags";
import type { DocumentItem } from "@/shared/types";
import { upsertDocument } from "./api";

function handleDocumentEvent(doc: DocumentItem) {
  const previous =
    queryClient.getQueryData<DocumentItem>(["documents", doc.id]) ??
    queryClient.getQueryData<DocumentItem[]>(["documents"])?.find((d) => d.id === doc.id);
  upsertDocument(doc);
  if (previous?.status === "processing" && doc.status === "ready") {
    void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    if (!hasSeen("first-ready")) {
      markSeen("first-ready");
      useUi.getState().celebrate(doc);
    } else {
      toast.success(`“${doc.fileName}” đã sẵn sàng`, {
        description: "Bạn có thể hỏi đáp về tài liệu này ngay.",
      });
    }
  }
  if (previous?.status === "processing" && doc.status === "failed") {
    toast.error(errorText(doc.errorCode ?? "E-07", { name: doc.fileName }));
  }
}

/**
 * Một kết nối SSE duy nhất cho toàn ứng dụng, cập nhật trạng thái tài liệu vào cache
 * (plan mục 7.2). Tự kết nối lại với backoff và đồng bộ lại danh sách sau khi kết nối lại.
 */
export function useDocumentEvents() {
  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    let attempt = 0;

    async function connect() {
      while (!stopped) {
        controller = new AbortController();
        try {
          const response = await apiFetch("/documents/events", {
            signal: controller.signal,
            headers: { Accept: "text/event-stream" },
          });
          if (attempt > 0) void queryClient.invalidateQueries({ queryKey: ["documents"] });
          attempt = 0;
          for await (const event of readSse(response)) {
            if (event.event === "document")
              handleDocumentEvent(JSON.parse(event.data) as DocumentItem);
          }
        } catch {
          if (stopped) return;
        }
        attempt += 1;
        await new Promise((r) => setTimeout(r, Math.min(30_000, 1000 * 2 ** attempt)));
      }
    }

    void connect();
    return () => {
      stopped = true;
      controller?.abort();
    };
  }, []);
}
