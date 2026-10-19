import { create } from "zustand";
import { queryClient } from "@/app/queryClient";
import { ApiError, apiFetch } from "@/shared/lib/api";
import { readSse } from "@/shared/lib/sse";
import type { Citation } from "@/shared/types";

export type StreamStatus = "searching" | "streaming" | "done" | "stopped" | "error";

export interface ActiveStream {
  conversationId: string;
  question: string;
  text: string;
  status: StreamStatus;
  documentCount: number;
  /** null khi chưa nhận sự kiện citations – chip hiển thị dạng chờ (plan mục 7.3) */
  citations: Citation[] | null;
  notFound: boolean;
  error: { code: string; message: string } | null;
  /** Id tin nhắn trên server – dùng để ẩn bản stream khi danh sách đã có tin nhắn thật */
  serverMessageId: string | null;
}

interface ChatStreamState {
  streams: Record<string, ActiveStream>;
  send: (conversationId: string, question: string) => Promise<void>;
  stop: (conversationId: string) => void;
  dismiss: (conversationId: string) => void;
}

const controllers = new Map<string, AbortController>();

/**
 * Trạng thái luồng câu trả lời được giữ ngoài component (theo conversationId),
 * nên chuyển route /chat → /chat/$id không làm mất luồng đang chạy.
 */
export const useChatStreams = create<ChatStreamState>()((set, get) => {
  const update = (id: string, patch: Partial<ActiveStream>) =>
    set((s) => {
      const current = s.streams[id];
      return current ? { streams: { ...s.streams, [id]: { ...current, ...patch } } } : s;
    });

  async function syncAfterStream(id: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["messages", id] }),
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      queryClient.invalidateQueries({ queryKey: ["me"] }),
    ]);
  }

  return {
    streams: {},

    async send(conversationId, question) {
      controllers.get(conversationId)?.abort();
      const controller = new AbortController();
      controllers.set(conversationId, controller);
      set((s) => ({
        streams: {
          ...s.streams,
          [conversationId]: {
            conversationId,
            question,
            text: "",
            status: "searching",
            documentCount: 0,
            citations: null,
            notFound: false,
            error: null,
            serverMessageId: null,
          },
        },
      }));

      // Gom token theo requestAnimationFrame để tránh re-render dày đặc (plan mục 7.2)
      let buffer = "";
      let frame = 0;
      const flush = () => {
        frame = 0;
        if (!buffer) return;
        const chunk = buffer;
        buffer = "";
        set((s) => {
          const current = s.streams[conversationId];
          if (!current) return s;
          return {
            streams: {
              ...s.streams,
              [conversationId]: { ...current, text: current.text + chunk, status: "streaming" },
            },
          };
        });
      };

      try {
        const response = await apiFetch(`/conversations/${conversationId}/messages`, {
          method: "POST",
          json: { content: question },
          signal: controller.signal,
          headers: { Accept: "text/event-stream" },
        });
        for await (const event of readSse(response)) {
          const data = JSON.parse(event.data);
          if (event.event === "status") {
            update(conversationId, { documentCount: data.documentCount ?? 0 });
          } else if (event.event === "token") {
            buffer += data.text;
            if (!frame) frame = requestAnimationFrame(flush);
          } else if (event.event === "citations") {
            cancelAnimationFrame(frame);
            flush();
            update(conversationId, { citations: data.citations });
          } else if (event.event === "done") {
            cancelAnimationFrame(frame);
            flush();
            update(conversationId, {
              status: "done",
              notFound: Boolean(data.notFound),
              serverMessageId: data.messageId,
            });
            await syncAfterStream(conversationId);
            get().dismiss(conversationId);
          } else if (event.event === "error") {
            throw new ApiError(
              500,
              data.code ?? "E-10",
              data.message ?? "AI đang bận hoặc gặp sự cố.",
            );
          }
        }
      } catch (error) {
        cancelAnimationFrame(frame);
        flush();
        if (controller.signal.aborted) {
          update(conversationId, {
            status: "stopped",
            citations: get().streams[conversationId]?.citations ?? [],
          });
          // Server lưu phần câu trả lời đã sinh kèm cờ stopped (SAD 5.3) – đồng bộ rồi thay bản tạm
          setTimeout(async () => {
            await syncAfterStream(conversationId);
            if (get().streams[conversationId]?.status === "stopped") get().dismiss(conversationId);
          }, 400);
          return;
        }
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(0, "E-10", "AI đang bận hoặc gặp sự cố. Vui lòng thử lại.");
        update(conversationId, {
          status: "error",
          error: { code: apiError.code, message: apiError.message },
        });
      } finally {
        if (controllers.get(conversationId) === controller) controllers.delete(conversationId);
      }
    },

    stop(conversationId) {
      controllers.get(conversationId)?.abort();
    },

    dismiss(conversationId) {
      set((s) => {
        const { [conversationId]: _removed, ...rest } = s.streams;
        return { streams: rest };
      });
    },
  };
});
