import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { MessageSquareDashedIcon, UploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUi } from "@/app/uiStore";
import { useMe } from "@/features/auth/api";
import {
  conversationsQuery,
  createConversation,
  messagesQuery,
  suggestionsQuery,
  updateConversation,
} from "@/features/conversations/api";
import { documentsQuery } from "@/features/documents/api";
import { modKey } from "@/shared/hooks/useHotkeys";
import { errorMessage } from "@/shared/lib/api";
import type { Conversation, Message } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { DocumentsIllustration } from "@/shared/ui/illustrations";
import { EmptyState, Kbd, Skeleton } from "@/shared/ui/misc";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Composer } from "./Composer";
import { Greeting } from "./Greeting";
import { AssistantMessage, UserMessage } from "./Messages";
import { ScopePicker } from "./ScopePicker";
import { useChatStreams } from "./streamStore";

export interface ChatSearch {
  scope?: string;
  doc?: string;
  page?: number;
}

export function ChatPage() {
  const params = useParams({ strict: false }) as { conversationId?: string };
  const search = useSearch({ strict: false }) as ChatSearch;
  const conversationId = params.conversationId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useMe();

  const documents = useQuery(documentsQuery);
  const conversations = useQuery(conversationsQuery);
  const messages = useQuery({
    ...messagesQuery(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
  const stream = useChatStreams((s) => (conversationId ? s.streams[conversationId] : undefined));
  const sendToStream = useChatStreams((s) => s.send);
  const stopStream = useChatStreams((s) => s.stop);
  const pendingQuestion = useUi((s) => s.pendingQuestion);
  const setPendingQuestion = useUi((s) => s.setPendingQuestion);
  const [draft, setDraft] = useState("");

  const readyDocs = useMemo(
    () => (documents.data ?? []).filter((d) => d.status === "ready"),
    [documents.data],
  );
  const conversation = conversations.data?.find((c) => c.id === conversationId);
  const urlScope = search.scope ? search.scope.split(",").filter(Boolean) : null;
  const scope = conversationId ? (conversation?.documentScope ?? null) : urlScope;
  const suggestions = useQuery({
    ...suggestionsQuery(scope),
    enabled: !conversationId && readyDocs.length > 0,
  });

  const streaming = stream?.status === "searching" || stream?.status === "streaming";
  const history = messages.data ?? [];
  const showStream =
    stream && !(stream.serverMessageId && history.some((m) => m.id === stream.serverMessageId));
  const lastQuestion =
    [...history].reverse().find((m) => m.role === "user")?.content ?? stream?.question;
  const remaining = me.quota.questionsLimit - me.quota.questionsToday;

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;
      setDraft("");
      let id = conversationId;
      if (!id) {
        try {
          const created = await createConversation(urlScope);
          queryClient.setQueryData<Conversation[]>(["conversations"], (list) => [
            created,
            ...(list ?? []),
          ]);
          queryClient.setQueryData<Message[]>(["messages", created.id], []);
          id = created.id;
        } catch (error) {
          setDraft(question);
          toast.error("Không tạo được hội thoại", { description: errorMessage(error) });
          return;
        }
        void sendToStream(id, question);
        void navigate({ to: "/chat/$conversationId", params: { conversationId: id }, search: {} });
        return;
      }
      void sendToStream(id, question);
    },
    [conversationId, urlScope, queryClient, sendToStream, navigate],
  );

  // Câu hỏi được chọn từ nơi khác (khoảnh khắc M5, command palette)
  useEffect(() => {
    if (pendingQuestion && readyDocs.length > 0 && !conversationId) {
      setPendingQuestion(null);
      void send(pendingQuestion);
    }
  }, [pendingQuestion, readyDocs.length, conversationId, send, setPendingQuestion]);

  async function changeScope(next: string[] | null) {
    if (!conversationId) {
      void navigate({
        to: "/chat",
        search: (prev: ChatSearch) => ({ ...prev, scope: next?.join(",") }),
      });
      return;
    }
    queryClient.setQueryData<Conversation[]>(["conversations"], (list) =>
      list?.map((c) => (c.id === conversationId ? { ...c, documentScope: next } : c)),
    );
    try {
      await updateConversation(conversationId, { documentScope: next });
    } catch (error) {
      toast.error("Không đổi được phạm vi", { description: errorMessage(error) });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }

  const noDocuments = documents.isSuccess && readyDocs.length === 0;
  const conversationMissing = conversationId && conversations.isSuccess && !conversation;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        actions={
          <span className="hidden items-center gap-1 text-small text-fg-muted lg:flex">
            <Kbd>{modKey}</Kbd>
            <Kbd>K</Kbd> tìm nhanh
          </span>
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h1
            key={conversation?.title ?? "new"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="max-w-[40%] shrink truncate font-semibold"
          >
            {conversation?.title ?? "Hội thoại mới"}
          </motion.h1>
        </AnimatePresence>
        {readyDocs.length > 0 && (
          <ScopePicker value={scope} onChange={(v) => void changeScope(v)} documents={readyDocs} />
        )}
      </PageHeader>

      {conversationMissing ? (
        <EmptyState
          illustration={<MessageSquareDashedIcon className="size-14 text-fg-muted" />}
          title="Không tìm thấy hội thoại"
          description="Hội thoại có thể đã bị xóa."
          action={
            <Button asChild>
              <Link to="/chat">Bắt đầu hội thoại mới</Link>
            </Button>
          }
        />
      ) : noDocuments && history.length === 0 ? (
        <NoDocuments />
      ) : !conversationId ? (
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Greeting
            fullName={me.fullName}
            readyCount={readyDocs.length}
            suggestions={suggestions.data?.suggestions}
            onPick={(q) => void send(q)}
          />
        </div>
      ) : (
        <MessageList
          key={conversationId}
          loading={messages.isPending}
          history={history}
          streamNode={
            showStream && stream ? (
              <>
                <UserMessage content={stream.question} />
                <AssistantMessage
                  content={stream.text}
                  citations={stream.citations}
                  status={stream.status}
                  notFound={stream.notFound}
                  documentCount={stream.documentCount}
                  error={stream.error}
                  scopeLimited={Boolean(scope)}
                  onClearScope={() => void changeScope(null)}
                  onRetry={() => void sendToStream(conversationId, stream.question)}
                />
              </>
            ) : null
          }
          streamActive={Boolean(showStream && streaming)}
          scopeLimited={Boolean(scope)}
          onClearScope={() => void changeScope(null)}
          streamText={stream?.text ?? ""}
        />
      )}

      <div className="shrink-0 px-4 pt-2 pb-4">
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => void send(draft)}
          onStop={() => conversationId && stopStream(conversationId)}
          streaming={streaming}
          disabled={noDocuments || Boolean(conversationMissing) || remaining <= 0}
          placeholder={
            noDocuments
              ? "Tải lên tài liệu để bắt đầu hỏi đáp…"
              : remaining <= 0
                ? "Bạn đã dùng hết số câu hỏi hôm nay"
                : undefined
          }
          remainingQuestions={remaining}
          lastQuestion={lastQuestion}
        />
      </div>
    </div>
  );
}

interface MessageListProps {
  loading: boolean;
  history: Message[];
  streamNode: React.ReactNode;
  streamActive: boolean;
  streamText: string;
  scopeLimited: boolean;
  onClearScope: () => void;
}

/** Luồng tin nhắn: tự cuộn theo khi người dùng đang ở cuối; thông báo trình đọc màn hình khi xong */
function MessageList({
  loading,
  history,
  streamNode,
  streamActive,
  streamText,
  scopeLimited,
  onClearScope,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [announcement, setAnnouncement] = useState("");
  const wasActive = useRef(streamActive);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  });

  useEffect(() => {
    if (wasActive.current && !streamActive) setAnnouncement("AI đã trả lời xong.");
    wasActive.current = streamActive;
  }, [streamActive]);

  // Tham chiếu streamText để danh sách cuộn theo khi câu trả lời dài dần
  void streamText;
  const lastAssistantId = [...history].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
      className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
    >
      <div
        role="log"
        aria-busy={streamActive}
        aria-label="Hội thoại"
        className="mx-auto w-full max-w-[760px] space-y-6 px-4 py-6"
      >
        {loading
          ? [0, 1].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="ml-auto h-10 w-2/3 rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))
          : history.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} content={m.content} />
              ) : (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  content={m.content}
                  citations={m.citations}
                  status="done"
                  notFound={m.notFound}
                  isLatest={m.id === lastAssistantId}
                  scopeLimited={scopeLimited}
                  onClearScope={onClearScope}
                />
              ),
            )}
        {streamNode}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

/** Trạng thái chưa có tài liệu (FR-26) */
function NoDocuments() {
  const openFilePicker = useUi((s) => s.openFilePicker);
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <EmptyState
        illustration={<DocumentsIllustration />}
        title="Tải tài liệu đầu tiên để bắt đầu"
        description="AI sẽ đọc các file PDF của bạn và trả lời mọi câu hỏi kèm trích dẫn nguồn để bạn kiểm chứng."
        action={
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={openFilePicker}>
              <UploadIcon /> Tải tài liệu đầu tiên
            </Button>
            <Link to="/documents" className="text-small text-brand hover:underline">
              Hoặc mở trang Tài liệu
            </Link>
          </div>
        }
      />
    </div>
  );
}
