const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("vi-VN");
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${decimal.format(bytes / 1024)} KB`;
  return `${decimal.format(bytes / (1024 * 1024))} MB`;
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${decimal.format(value / 1_000_000)} tr`;
  if (value >= 1_000) return `${decimal.format(value / 1_000)} N`;
  return integer.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export type DayBucket = "Hôm nay" | "Hôm qua" | "7 ngày trước" | "Cũ hơn";
const BUCKETS: DayBucket[] = ["Hôm nay", "Hôm qua", "7 ngày trước", "Cũ hơn"];

export function dayBucket(iso: string, now = new Date()): DayBucket {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days <= 7) return "7 ngày trước";
  return "Cũ hơn";
}

/** Nhóm hội thoại theo "Hôm nay / Hôm qua / 7 ngày trước / Cũ hơn" (SRS FR-31) */
export function groupByDay<T>(
  items: T[],
  getDate: (item: T) => string,
  now = new Date(),
): { label: DayBucket; items: T[] }[] {
  const groups = new Map<DayBucket, T[]>();
  for (const item of items) {
    const bucket = dayBucket(getDate(item), now);
    const list = groups.get(bucket) ?? [];
    list.push(item);
    groups.set(bucket, list);
  }
  return BUCKETS.filter((b) => groups.has(b)).map((label) => ({
    label,
    items: groups.get(label) ?? [],
  }));
}

export function greeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 11) return "Chào buổi sáng";
  if (hour >= 11 && hour < 13) return "Chào buổi trưa";
  if (hour >= 13 && hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Tên gọi của người Việt là từ cuối cùng trong họ tên */
export function givenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
