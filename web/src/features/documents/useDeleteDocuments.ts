import { toast } from "sonner";
import { queryClient } from "@/app/queryClient";
import { errorMessage } from "@/shared/lib/api";
import type { DocumentItem } from "@/shared/types";
import { deleteDocuments, pendingDeletes } from "./api";

const UNDO_MS = 5000;

/**
 * Xóa tài liệu với toast "Hoàn tác" trong 5 giây (M15).
 * Ẩn ngay khỏi giao diện, chỉ gọi API khi hết thời gian hoàn tác.
 */
export function deleteDocumentsWithUndo(docs: DocumentItem[]) {
  if (docs.length === 0) return;
  const ids = docs.map((d) => d.id);
  for (const id of ids) pendingDeletes.add(id);
  queryClient.setQueryData<DocumentItem[]>(["documents"], (list) =>
    list?.filter((d) => !ids.includes(d.id)),
  );

  let undone = false;
  const timer = setTimeout(async () => {
    if (undone) return;
    try {
      await deleteDocuments(ids);
      for (const id of ids) queryClient.removeQueries({ queryKey: ["documents", id] });
      // Trích dẫn cũ cần hiển thị "Tài liệu đã bị xóa" (FR-14)
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
      void queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    } catch (error) {
      toast.error("Không xóa được tài liệu", { description: errorMessage(error) });
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    } finally {
      for (const id of ids) pendingDeletes.delete(id);
    }
  }, UNDO_MS);

  const label = docs.length === 1 ? `“${docs[0]?.fileName}”` : `${docs.length} tài liệu`;
  toast(`Đã xóa ${label}`, {
    duration: UNDO_MS,
    action: {
      label: "Hoàn tác",
      onClick: () => {
        undone = true;
        clearTimeout(timer);
        for (const id of ids) pendingDeletes.delete(id);
        queryClient.setQueryData<DocumentItem[]>(["documents"], (list) =>
          [...docs, ...(list ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
      },
    },
  });
}
