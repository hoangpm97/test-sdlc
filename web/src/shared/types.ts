export type Role = "user" | "admin";
export type UserStatus = "active" | "disabled" | "must_change_password";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Me extends User {
  quota: { questionsToday: number; questionsLimit: number };
}

export type DocumentStatus = "processing" | "ready" | "failed";

export interface DocumentItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  pageCount: number | null;
  status: DocumentStatus;
  /** Nhãn tiến trình khi đang xử lý, ví dụ "Đang phân tích nội dung…" */
  processingStage: string | null;
  errorCode: string | null;
  summary: string | null;
  keyPoints: string[] | null;
  createdAt: string;
}

export interface Citation {
  index: number;
  documentId: string;
  fileName: string;
  page: number;
  snippet: string;
  /** Tài liệu nguồn đã bị xóa (FR-14) */
  deleted?: boolean;
}

export interface Feedback {
  rating: 1 | -1;
  comment?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  createdAt: string;
  stopped?: boolean;
  notFound?: boolean;
  feedback?: Feedback | null;
}

export interface Conversation {
  id: string;
  title: string;
  /** null = tất cả tài liệu */
  documentScope: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRow extends User {
  questionsToday: number;
  tokensMonth: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  summary: { questionsToday: number; tokensMonth: number; monthlyTokenBudget: number };
}
