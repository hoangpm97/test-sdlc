import type { Conversation, DocumentItem, Me, Message, User } from "@/shared/types";
import type { Chunk } from "./search";

/** Cơ sở dữ liệu trong bộ nhớ cho chế độ demo. Dữ liệu mất khi tải lại trang. */

export interface MockUser extends User {
  password: string;
  failedLogins: number;
  lockedUntil: number | null;
}

export interface MockDocument {
  doc: DocumentItem;
  ownerId: string;
  blob: Blob;
  chunks: Chunk[];
  objectUrl: string | null;
}

interface Usage {
  day: string;
  questionsToday: number;
  tokensMonth: number;
}

const now = Date.now();
const iso = (offsetDays: number) => new Date(now - offsetDays * 86_400_000).toISOString();

export const DEMO_ACCOUNTS = [
  { email: "minh@congty.vn", password: "matkhau123", label: "Chuyên viên BD" },
  { email: "admin@congty.vn", password: "admin12345", label: "Quản trị viên" },
  { email: "huy@congty.vn", password: "tam1234567", label: "Nhân viên mới (đổi mật khẩu)" },
];

export const db = {
  users: [
    {
      id: "u_minh",
      email: "minh@congty.vn",
      fullName: "Nguyễn Văn Minh",
      role: "user",
      status: "active",
      createdAt: iso(60),
      lastLoginAt: iso(1),
      password: "matkhau123",
      failedLogins: 0,
      lockedUntil: null,
    },
    {
      id: "u_lan",
      email: "lan@congty.vn",
      fullName: "Trần Thị Lan",
      role: "user",
      status: "active",
      createdAt: iso(55),
      lastLoginAt: iso(0),
      password: "matkhau123",
      failedLogins: 0,
      lockedUntil: null,
    },
    {
      id: "u_admin",
      email: "admin@congty.vn",
      fullName: "Phạm Quốc Admin",
      role: "admin",
      status: "active",
      createdAt: iso(90),
      lastLoginAt: iso(2),
      password: "admin12345",
      failedLogins: 0,
      lockedUntil: null,
    },
    {
      id: "u_huy",
      email: "huy@congty.vn",
      fullName: "Lê Đức Huy",
      role: "user",
      status: "must_change_password",
      createdAt: iso(1),
      lastLoginAt: null,
      password: "tam1234567",
      failedLogins: 0,
      lockedUntil: null,
    },
  ] as MockUser[],
  documents: new Map<string, MockDocument>(),
  conversations: new Map<string, Conversation & { ownerId: string }>(),
  messages: new Map<string, Message[]>(),
  usage: new Map<string, Usage>([
    ["u_lan", { day: today(), questionsToday: 23, tokensMonth: 412_000 }],
    ["u_admin", { day: today(), questionsToday: 2, tokensMonth: 18_500 }],
  ]),
  settings: {
    dailyQuestionLimit: 200,
    monthlyTokenBudget: 5_000_000,
    maxDocumentsPerUser: 100,
  },
};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ---------------- Phiên đăng nhập ---------------- */
const SESSION_KEY = "cwd.mock.session";

export function getSessionUser(): MockUser | null {
  let id: string | null = null;
  try {
    id = localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  const user = db.users.find((u) => u.id === id);
  return user && user.status !== "disabled" ? user : null;
}

export function setSession(userId: string | null) {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // bỏ qua
  }
}

/* ---------------- Hạn mức sử dụng ---------------- */
export function getUsage(userId: string): Usage {
  const usage = db.usage.get(userId);
  if (!usage) {
    const fresh = { day: today(), questionsToday: 0, tokensMonth: 0 };
    db.usage.set(userId, fresh);
    return fresh;
  }
  if (usage.day !== today()) {
    usage.day = today();
    usage.questionsToday = 0;
  }
  return usage;
}

export function toPublicUser(user: MockUser): User {
  const { password: _p, failedLogins: _f, lockedUntil: _l, ...rest } = user;
  return rest;
}

export function toMe(user: MockUser): Me {
  return {
    ...toPublicUser(user),
    quota: {
      questionsToday: getUsage(user.id).questionsToday,
      questionsLimit: db.settings.dailyQuestionLimit,
    },
  };
}

/* ---------------- Sự kiện trạng thái tài liệu (SSE) ---------------- */
type Listener = (doc: DocumentItem) => void;
const listeners = new Map<string, Set<Listener>>();

export function subscribeDocuments(userId: string, listener: Listener): () => void {
  const set = listeners.get(userId) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(userId, set);
  return () => set.delete(listener);
}

export function publishDocument(userId: string, doc: DocumentItem) {
  for (const listener of listeners.get(userId) ?? []) listener(doc);
}
