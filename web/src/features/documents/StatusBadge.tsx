import { AlertCircleIcon } from "lucide-react";
import { useRef } from "react";
import { errorText, shortErrorText } from "@/shared/i18n/errors";
import { CheckDraw } from "@/shared/motion/CheckDraw";
import type { DocumentItem } from "@/shared/types";
import { Badge } from "@/shared/ui/misc";
import { Tooltip } from "@/shared/ui/overlays";

/** Badge trạng thái động: shimmer khi xử lý (M3), vẽ dấu ✓ khi sẵn sàng (M4) */
export function StatusBadge({ doc }: { doc: DocumentItem }) {
  // Chỉ chạy animation ✓ khi tài liệu vừa chuyển trạng thái trong phiên này
  const initialStatus = useRef(doc.status);

  if (doc.status === "processing") {
    return (
      <span className="inline-flex items-center gap-2 text-small font-medium">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-brand" />
        </span>
        <span className="shimmer-text">{doc.processingStage ?? "Đang xử lý…"}</span>
      </span>
    );
  }

  if (doc.status === "ready") {
    return (
      <Badge tone="success">
        <CheckDraw size={14} animate={initialStatus.current !== "ready"} />
        Sẵn sàng
      </Badge>
    );
  }

  return (
    <Tooltip content={errorText(doc.errorCode ?? "E-07", { name: doc.fileName })}>
      <button type="button" className="cursor-help rounded-full">
        <Badge tone="danger">
          <AlertCircleIcon />
          {shortErrorText(doc.errorCode)}
        </Badge>
      </button>
    </Tooltip>
  );
}
