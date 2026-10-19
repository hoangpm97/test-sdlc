import { queryOptions } from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import type { Conversation, Feedback, Message } from "@/shared/types";

export const conversationsQuery = queryOptions({
  queryKey: ["conversations"],
  queryFn: () => api<Conversation[]>("/conversations"),
});

export const messagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["messages", conversationId],
    queryFn: () => api<Message[]>(`/conversations/${conversationId}/messages`),
  });

export const suggestionsQuery = (scope: string[] | null) =>
  queryOptions({
    queryKey: ["suggestions", scope?.join(",") ?? "all"],
    queryFn: () =>
      api<{ suggestions: string[] }>(
        `/suggestions${scope ? `?scope=${encodeURIComponent(scope.join(","))}` : ""}`,
      ),
    staleTime: 60_000,
  });

export function createConversation(documentScope: string[] | null) {
  return api<Conversation>("/conversations", { method: "POST", json: { documentScope } });
}

export function updateConversation(
  id: string,
  patch: Partial<Pick<Conversation, "title" | "documentScope">>,
) {
  return api<Conversation>(`/conversations/${id}`, { method: "PATCH", json: patch });
}

export function deleteConversation(id: string) {
  return api<void>(`/conversations/${id}`, { method: "DELETE" });
}

export function sendFeedback(messageId: string, feedback: Feedback) {
  return api<Message>(`/messages/${messageId}/feedback`, { method: "PUT", json: feedback });
}
