import { describe, expect, it } from "vitest";
import { dayBucket, formatBytes, givenName, greeting, groupByDay, initials } from "./format";

describe("format", () => {
  it("định dạng dung lượng theo vi-VN", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2,5 MB");
  });

  it("lấy tên gọi và chữ viết tắt của người Việt", () => {
    expect(givenName("Nguyễn Văn Minh")).toBe("Minh");
    expect(initials("Nguyễn Văn Minh")).toBe("NM");
  });

  it("chào theo buổi", () => {
    expect(greeting(8)).toBe("Chào buổi sáng");
    expect(greeting(12)).toBe("Chào buổi trưa");
    expect(greeting(15)).toBe("Chào buổi chiều");
    expect(greeting(21)).toBe("Chào buổi tối");
  });

  it("nhóm hội thoại theo ngày (FR-31)", () => {
    const now = new Date("2026-10-19T10:00:00");
    expect(dayBucket("2026-10-19T08:00:00", now)).toBe("Hôm nay");
    expect(dayBucket("2026-10-18T23:00:00", now)).toBe("Hôm qua");
    expect(dayBucket("2026-10-14T08:00:00", now)).toBe("7 ngày trước");
    expect(dayBucket("2026-09-01T08:00:00", now)).toBe("Cũ hơn");

    const groups = groupByDay(
      [{ d: "2026-09-01T08:00:00" }, { d: "2026-10-19T09:00:00" }],
      (x) => x.d,
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(["Hôm nay", "Cũ hơn"]);
  });
});
