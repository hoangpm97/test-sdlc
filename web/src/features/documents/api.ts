import { queryOptions } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { API_BASE, ApiError, api } from "@/shared/lib/api";
import type { DocumentItem } from "@/shared/types";

export const documentsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: () => api<DocumentItem[]>("/documents"),
});

export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: ["documents", id],
    queryFn: () => api<DocumentItem>(`/documents/${id}`),
    initialData: () =>
      queryClient.getQueryData<DocumentItem[]>(["documents"])?.find((d) => d.id === id),
  });

export const documentFileQuery = (id: string) =>
  queryOptions({
    queryKey: ["documents", id, "file"],
    queryFn: () => api<{ url: string }>(`/documents/${id}/file`),
    staleTime: 4 * 60_000, // signed URL hết hạn sau 5 phút (SAD 5.2)
  });

/** Các tài liệu đang chờ xóa (trong 5 giây có thể hoàn tác) – bỏ qua sự kiện SSE của chúng */
export const pendingDeletes = new Set<string>();

export function upsertDocument(doc: DocumentItem) {
  if (pendingDeletes.has(doc.id)) return;
  queryClient.setQueryData<DocumentItem[]>(["documents"], (list) => {
    if (!list) return list;
    return list.some((d) => d.id === doc.id)
      ? list.map((d) => (d.id === doc.id ? doc : d))
      : [doc, ...list];
  });
  queryClient.setQueryData(["documents", doc.id], doc);
}

export function deleteDocuments(ids: string[]) {
  if (ids.length === 1) return api<void>(`/documents/${ids[0]}`, { method: "DELETE" });
  return api<void>("/documents/bulk-delete", { method: "POST", json: { ids } });
}

/** Tải lên một file bằng XHR để có tiến trình (plan mục 7.2) */
export function uploadDocument(
  file: File,
  onProgress: (percent: number) => void,
): Promise<DocumentItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/documents`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // phản hồi rỗng
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body as DocumentItem);
      const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
      reject(
        new ApiError(
          xhr.status,
          error?.code ?? `HTTP-${xhr.status}`,
          error?.message ?? "Tải lên thất bại.",
        ),
      );
    };
    xhr.onerror = () => reject(new ApiError(0, "E-NETWORK", "Mất kết nối mạng. Vui lòng thử lại."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
