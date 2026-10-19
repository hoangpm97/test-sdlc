/**
 * Cờ "đã xem" cho các khoảnh khắc chỉ hiện một lần (plan mục 4.3 – ngân sách "wow").
 * Lưu trong localStorage; mọi lỗi truy cập storage đều được bỏ qua.
 */
const PREFIX = "cwd.once.";

export type OnceFlag = "first-ready" | "first-citation-tip";

export function hasSeen(flag: OnceFlag): boolean {
  try {
    return localStorage.getItem(PREFIX + flag) === "1";
  } catch {
    return false;
  }
}

export function markSeen(flag: OnceFlag): void {
  try {
    localStorage.setItem(PREFIX + flag, "1");
  } catch {
    // Bỏ qua: chế độ ẩn danh hoặc storage bị chặn
  }
}
