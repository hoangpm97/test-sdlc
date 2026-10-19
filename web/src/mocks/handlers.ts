import { HttpResponse, http } from "msw";
import { encodeSse } from "@/shared/lib/sse";
import type { Citation, Conversation, DocumentItem, Message } from "@/shared/types";
import {
  db,
  getSessionUser,
  getUsage,
  type MockUser,
  publishDocument,
  setSession,
  sleep,
  subscribeDocuments,
  toMe,
  toPublicUser,
  uid,
} from "./db";
import { extractPages, PdfReadError } from "./pdfText";
import {
  chunkPages,
  composeAnswer,
  composeSummaryAnswer,
  search,
  summarize,
  tokenize,
} from "./search";

const API = "/api/v1";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ error: { code, message, ...extra } }, { status });
}

const unauthorized = () => fail(401, "E-AUTH-REQUIRED", "Phiên đăng nhập đã hết hạn.");

function sse(stream: ReadableStream<Uint8Array>) {
  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

const latency = () => sleep(150 + Math.random() * 250);

function userDocuments(userId: string) {
  return [...db.documents.values()]
    .filter((d) => d.ownerId === userId)
    .sort((a, b) => b.doc.createdAt.localeCompare(a.doc.createdAt));
}

function withDeletedFlags(message: Message): Message {
  return {
    ...message,
    citations: message.citations.map((c) => ({ ...c, deleted: !db.documents.has(c.documentId) })),
  };
}

/* ---------------- Xử lý tài liệu bất đồng bộ (SAD 4.1) ---------------- */
async function processDocument(userId: string, docId: string) {
  const entry = () => db.documents.get(docId);
  const update = (patch: Partial<DocumentItem>) => {
    const e = entry();
    if (!e) return false;
    e.doc = { ...e.doc, ...patch };
    publishDocument(userId, e.doc);
    return true;
  };

  await sleep(700);
  const current = entry();
  if (!current) return;
  try {
    const pages = await extractPages(await current.blob.arrayBuffer());
    if (!update({ pageCount: pages.length, processingStage: "Đang phân tích nội dung…" })) return;
    current.chunks = chunkPages(
      pages.map((text, i) => ({
        documentId: docId,
        fileName: current.doc.fileName,
        page: i + 1,
        text,
      })),
    );
    await sleep(900 + Math.min(pages.length * 20, 1500));
    if (!update({ processingStage: "Đang tạo tóm tắt…" })) return;
    await sleep(900);
    const { summary, keyPoints } = summarize(pages);
    update({ status: "ready", processingStage: null, summary, keyPoints });
  } catch (error) {
    const code = error instanceof PdfReadError ? error.code : "E-07";
    update({ status: "failed", processingStage: null, errorCode: code });
  }
}

/* ---------------- Gợi ý câu hỏi ---------------- */
function buildSuggestions(userId: string, scope: string[] | null): string[] {
  const docs = userDocuments(userId)
    .filter((d) => d.doc.status === "ready")
    .filter((d) => !scope || scope.includes(d.doc.id));
  if (docs.length === 0) return [];
  const first = docs[0]?.doc.fileName.replace(/\.pdf$/i, "");
  const suggestions = [`Tóm tắt nội dung chính của ${first}`];
  // Từ tiếng Việt thường gồm 2 âm tiết ("thanh toán", "chiết khấu") nên lấy cụm 2 từ liền kề
  const phrases = new Map<string, number>();
  for (const d of docs) {
    const text = [d.doc.summary ?? "", ...(d.doc.keyPoints ?? [])].join(" ");
    const tokens = tokenize(text).filter((t) => !/\d/.test(t));
    for (let i = 0; i < tokens.length - 1; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]}`;
      phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
    }
  }
  const top = [...phrases.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);
  if (top[0]) suggestions.push(`Tài liệu nói gì về ${top[0]}?`);
  if (top[1] && top[2]) suggestions.push(`Các điểm chính về ${top[1]} và ${top[2]}?`);
  if (docs.length > 1) suggestions.push("Tóm tắt các tài liệu đang có");
  return suggestions.slice(0, 4);
}

/* ---------------- Handlers ---------------- */
export const handlers = [
  /* ===== Xác thực ===== */
  http.post(`${API}/auth/login`, async ({ request }) => {
    await latency();
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user?.lockedUntil && user.lockedUntil > Date.now()) {
      return fail(423, "E-LOCKED", "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần.", {
        lockedUntil: new Date(user.lockedUntil).toISOString(),
      });
    }
    if (!user || user.password !== password) {
      if (user) {
        user.failedLogins += 1;
        if (user.failedLogins >= 5) {
          user.failedLogins = 0;
          user.lockedUntil = Date.now() + 15 * 60_000;
          return fail(423, "E-LOCKED", "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần.", {
            lockedUntil: new Date(user.lockedUntil).toISOString(),
          });
        }
      }
      return fail(401, "E-AUTH", "Email hoặc mật khẩu không đúng.");
    }
    if (user.status === "disabled") {
      return fail(
        403,
        "E-DISABLED",
        "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
      );
    }
    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date().toISOString();
    setSession(user.id);
    return HttpResponse.json(toMe(user));
  }),

  http.post(`${API}/auth/logout`, () => {
    setSession(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/auth/change-password`, async ({ request }) => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    const { newPassword } = (await request.json()) as { newPassword: string };
    if (newPassword.length < 10 || !/\p{L}/u.test(newPassword) || !/\d/.test(newPassword)) {
      return fail(400, "E-WEAK-PASSWORD", "Mật khẩu cần ít nhất 10 ký tự, gồm cả chữ và số.");
    }
    if (newPassword === user.password) {
      return fail(400, "E-SAME-PASSWORD", "Mật khẩu mới phải khác mật khẩu tạm.");
    }
    user.password = newPassword;
    user.status = "active";
    return HttpResponse.json(toMe(user));
  }),

  http.get(`${API}/me`, () => {
    const user = getSessionUser();
    return user ? HttpResponse.json(toMe(user)) : unauthorized();
  }),

  /* ===== Tài liệu ===== */
  http.get(`${API}/documents/events`, () => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const encoder = new TextEncoder();
    let unsubscribe = () => {};
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": connected\n\n"));
        unsubscribe = subscribeDocuments(user.id, (doc) => {
          try {
            controller.enqueue(encoder.encode(encodeSse("document", doc)));
          } catch {
            unsubscribe();
          }
        });
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            clearInterval(heartbeat);
          }
        }, 15_000);
      },
      cancel() {
        unsubscribe();
        clearInterval(heartbeat);
      },
    });
    return sse(stream);
  }),

  http.get(`${API}/documents`, async () => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    return HttpResponse.json(userDocuments(user.id).map((d) => d.doc));
  }),

  http.post(`${API}/documents`, async ({ request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail(400, "E-01", "Thiếu file tải lên.");
    if (userDocuments(user.id).length >= db.settings.maxDocumentsPerUser) {
      return fail(400, "E-06", "Bạn đã đạt giới hạn 100 tài liệu.");
    }
    if (file.size > MAX_FILE_BYTES) return fail(413, "E-02", `File ${file.name} vượt quá 50 MB.`);
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...head) !== "%PDF-") {
      return fail(415, "E-01", `File ${file.name} không phải PDF.`);
    }
    await latency();
    const doc: DocumentItem = {
      id: uid("doc"),
      fileName: file.name,
      sizeBytes: file.size,
      pageCount: null,
      status: "processing",
      processingStage: "Đang đọc nội dung…",
      errorCode: null,
      summary: null,
      keyPoints: null,
      createdAt: new Date().toISOString(),
    };
    db.documents.set(doc.id, { doc, ownerId: user.id, blob: file, chunks: [], objectUrl: null });
    void processDocument(user.id, doc.id);
    return HttpResponse.json(doc, { status: 202 });
  }),

  http.post(`${API}/documents/bulk-delete`, async ({ request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const { ids } = (await request.json()) as { ids: string[] };
    for (const id of ids) {
      const entry = db.documents.get(id);
      if (entry?.ownerId === user.id) {
        if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
        db.documents.delete(id);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/documents/:id`, async ({ params }) => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    const entry = db.documents.get(String(params.id));
    if (!entry || entry.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy tài liệu.");
    return HttpResponse.json(entry.doc);
  }),

  /* Backend thật trả signed URL hết hạn sau 5 phút (SAD 5.2); bản demo trả object URL của file đã tải lên */
  http.get(`${API}/documents/:id/file`, ({ params }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const entry = db.documents.get(String(params.id));
    if (!entry || entry.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy tài liệu.");
    entry.objectUrl ??= URL.createObjectURL(entry.blob);
    return HttpResponse.json({ url: entry.objectUrl });
  }),

  http.delete(`${API}/documents/:id`, ({ params }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const entry = db.documents.get(String(params.id));
    if (!entry || entry.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy tài liệu.");
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    db.documents.delete(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  /* ===== Hội thoại ===== */
  http.get(`${API}/conversations`, async () => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    const list = [...db.conversations.values()]
      .filter((c) => c.ownerId === user.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ ownerId: _o, ...c }) => c);
    return HttpResponse.json(list);
  }),

  http.post(`${API}/conversations`, async ({ request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const { documentScope = null } = (await request.json()) as { documentScope?: string[] | null };
    const stamp = new Date().toISOString();
    const conversation: Conversation = {
      id: uid("conv"),
      title: "Hội thoại mới",
      documentScope: documentScope && documentScope.length > 0 ? documentScope : null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    db.conversations.set(conversation.id, { ...conversation, ownerId: user.id });
    db.messages.set(conversation.id, []);
    return HttpResponse.json(conversation, { status: 201 });
  }),

  http.patch(`${API}/conversations/:id`, async ({ params, request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const conv = db.conversations.get(String(params.id));
    if (!conv || conv.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy hội thoại.");
    const patch = (await request.json()) as Partial<Pick<Conversation, "title" | "documentScope">>;
    if (patch.title !== undefined) conv.title = patch.title.trim().slice(0, 60) || conv.title;
    if (patch.documentScope !== undefined) {
      conv.documentScope =
        patch.documentScope && patch.documentScope.length > 0 ? patch.documentScope : null;
    }
    const { ownerId: _o, ...rest } = conv;
    return HttpResponse.json(rest);
  }),

  http.delete(`${API}/conversations/:id`, ({ params }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const conv = db.conversations.get(String(params.id));
    if (conv?.ownerId === user.id) {
      db.conversations.delete(conv.id);
      db.messages.delete(conv.id);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/conversations/:id/messages`, async ({ params }) => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    const conv = db.conversations.get(String(params.id));
    if (!conv || conv.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy hội thoại.");
    return HttpResponse.json((db.messages.get(conv.id) ?? []).map(withDeletedFlags));
  }),

  http.get(`${API}/suggestions`, ({ request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const scopeParam = new URL(request.url).searchParams.get("scope");
    const scope = scopeParam ? scopeParam.split(",") : null;
    return HttpResponse.json({ suggestions: buildSuggestions(user.id, scope) });
  }),

  /* Gửi câu hỏi – phản hồi dạng SSE (SAD 5.3) */
  http.post(`${API}/conversations/:id/messages`, async ({ params, request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const conv = db.conversations.get(String(params.id));
    if (!conv || conv.ownerId !== user.id)
      return fail(404, "E-NOT-FOUND", "Không tìm thấy hội thoại.");

    const { content } = (await request.json()) as { content: string };
    const question = content.trim();
    if (question.length === 0 || question.length > 2000) {
      return fail(400, "E-INVALID", "Câu hỏi cần từ 1 đến 2.000 ký tự.");
    }
    const usage = getUsage(user.id);
    if (usage.questionsToday >= db.settings.dailyQuestionLimit) {
      const n = db.settings.dailyQuestionLimit;
      return fail(
        429,
        "E-11",
        `Bạn đã dùng hết số câu hỏi trong ngày (${n}/${n}). Hạn mức sẽ được làm mới lúc 0h.`,
      );
    }
    const scopeDocs = userDocuments(user.id).filter(
      (d) =>
        d.doc.status === "ready" && (!conv.documentScope || conv.documentScope.includes(d.doc.id)),
    );
    if (scopeDocs.length === 0) {
      return fail(400, "E-NO-DOCS", "Chưa có tài liệu nào sẵn sàng để hỏi đáp.");
    }

    const history = db.messages.get(conv.id) ?? [];
    const userMessage: Message = {
      id: uid("msg"),
      conversationId: conv.id,
      role: "user",
      content: question,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    history.push(userMessage);
    db.messages.set(conv.id, history);
    usage.questionsToday += 1;

    // Mô phỏng bước "viết lại câu hỏi tiếp nối" (FR-21): câu hỏi ngắn kế thừa từ khóa câu trước
    const previousQuestion = [...history]
      .reverse()
      .find((m) => m.role === "user" && m.id !== userMessage.id);
    const effectiveQuery =
      tokenize(question).length < 2 && previousQuestion
        ? `${previousQuestion.content} ${question}`
        : question;

    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          if (cancelled) return;
          try {
            controller.enqueue(encoder.encode(encodeSse(event, data)));
          } catch {
            cancelled = true;
          }
        };
        try {
          send("status", { stage: "searching", documentCount: scopeDocs.length });
          await sleep(650 + Math.random() * 400);

          const wantsSummary = /tóm tắt|tổng quan|summary|summari[sz]e/i.test(question);
          const answer = wantsSummary
            ? composeSummaryAnswer(
                scopeDocs.slice(0, 3).map((d) => ({
                  documentId: d.doc.id,
                  fileName: d.doc.fileName,
                  summary: d.doc.summary ?? "",
                })),
              )
            : composeAnswer(
                effectiveQuery,
                search(
                  scopeDocs.flatMap((d) => d.chunks),
                  effectiveQuery,
                ),
              );

          let text = "";
          const pieces = answer.content.match(/\S+\s*/g) ?? [];
          for (let i = 0; i < pieces.length; i += 3) {
            if (cancelled || request.signal.aborted) break;
            const chunk = pieces.slice(i, i + 3).join("");
            text += chunk;
            send("token", { text: chunk });
            await sleep(28 + Math.random() * 40);
          }
          const stopped = cancelled || request.signal.aborted;
          const citations: Citation[] = answer.citations.filter((c) =>
            text.includes(`[${c.index}]`),
          );
          send("citations", { citations });

          const assistant: Message = {
            id: uid("msg"),
            conversationId: conv.id,
            role: "assistant",
            content: text,
            citations,
            createdAt: new Date().toISOString(),
            stopped,
            notFound: answer.notFound,
            feedback: null,
          };
          history.push(assistant);
          conv.updatedAt = assistant.createdAt;
          if (conv.title === "Hội thoại mới") {
            conv.title = question.length > 60 ? `${question.slice(0, 57)}…` : question;
          }
          const inputTokens = Math.round((effectiveQuery.length + 4000) / 4);
          const outputTokens = Math.round(text.length / 4);
          usage.tokensMonth += inputTokens + outputTokens;
          send("done", {
            messageId: assistant.id,
            notFound: answer.notFound,
            usage: { inputTokens, outputTokens },
          });
        } catch {
          send("error", { code: "E-10", message: "AI đang bận hoặc gặp sự cố. Vui lòng thử lại." });
        } finally {
          try {
            controller.close();
          } catch {
            // luồng đã bị hủy
          }
        }
      },
      cancel() {
        cancelled = true;
      },
    });
    return sse(stream);
  }),

  http.put(`${API}/messages/:id/feedback`, async ({ params, request }) => {
    const user = getSessionUser();
    if (!user) return unauthorized();
    const feedback = (await request.json()) as Message["feedback"];
    for (const [convId, list] of db.messages) {
      if (db.conversations.get(convId)?.ownerId !== user.id) continue;
      const message = list.find((m) => m.id === params.id);
      if (message) {
        message.feedback = feedback;
        return HttpResponse.json(message);
      }
    }
    return fail(404, "E-NOT-FOUND", "Không tìm thấy câu trả lời.");
  }),

  /* ===== Quản trị ===== */
  http.get(`${API}/admin/users`, async () => {
    await latency();
    const user = getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "admin") return fail(403, "E-FORBIDDEN", "Bạn không có quyền truy cập.");
    const users = db.users.map((u) => {
      const usage = getUsage(u.id);
      return {
        ...toPublicUser(u),
        questionsToday: usage.questionsToday,
        tokensMonth: usage.tokensMonth,
      };
    });
    return HttpResponse.json({
      users,
      summary: {
        questionsToday: users.reduce((s, u) => s + u.questionsToday, 0),
        tokensMonth: users.reduce((s, u) => s + u.tokensMonth, 0),
        monthlyTokenBudget: db.settings.monthlyTokenBudget,
      },
    });
  }),

  http.post(`${API}/admin/users`, async ({ request }) => {
    await latency();
    const user = getSessionUser();
    if (user?.role !== "admin") return fail(403, "E-FORBIDDEN", "Bạn không có quyền truy cập.");
    const body = (await request.json()) as {
      email: string;
      fullName: string;
      tempPassword: string;
    };
    const email = body.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) {
      return fail(409, "E-EMAIL-EXISTS", "Email này đã được sử dụng.");
    }
    const created: MockUser = {
      id: uid("u"),
      email,
      fullName: body.fullName.trim(),
      role: "user",
      status: "must_change_password",
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      password: body.tempPassword,
      failedLogins: 0,
      lockedUntil: null,
    };
    db.users.push(created);
    return HttpResponse.json(toPublicUser(created), { status: 201 });
  }),

  http.patch(`${API}/admin/users/:id`, async ({ params, request }) => {
    const user = getSessionUser();
    if (user?.role !== "admin") return fail(403, "E-FORBIDDEN", "Bạn không có quyền truy cập.");
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return fail(404, "E-NOT-FOUND", "Không tìm thấy người dùng.");
    const { status } = (await request.json()) as { status: "active" | "disabled" };
    if (target.id === user.id)
      return fail(400, "E-SELF", "Bạn không thể tự vô hiệu hóa tài khoản của mình.");
    target.status =
      status === "active" && target.lastLoginAt === null ? "must_change_password" : status;
    return HttpResponse.json(toPublicUser(target));
  }),
];
