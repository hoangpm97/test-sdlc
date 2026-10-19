export const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let onUnauthorized: (() => void) | null = null;

/** Được gọi khi phiên hết hạn (401) để chuyển về trang đăng nhập */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

type ApiInit = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit };

export async function apiFetch(path: string, init: ApiInit = {}): Promise<Response> {
  const { json, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  let body = rest.body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    body,
    headers,
    credentials: "include",
  });
  if (!res.ok) throw await toApiError(res, path);
  return res;
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function toApiError(res: Response, path = ""): Promise<ApiError> {
  let code = `HTTP-${res.status}`;
  let message = "Đã có lỗi xảy ra. Vui lòng thử lại.";
  let details: Record<string, unknown> = {};
  try {
    const data = (await res.json()) as {
      error?: { code?: string; message?: string } & Record<string, unknown>;
    };
    if (data.error) {
      const { code: c, message: m, ...rest } = data.error;
      code = c ?? code;
      message = m ?? message;
      details = rest;
    }
  } catch {
    // Phản hồi không phải JSON
  }
  if (res.status === 401 && !path.startsWith("/auth/")) onUnauthorized?.();
  return new ApiError(res.status, code, message, details);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.name !== "AbortError") return error.message;
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
