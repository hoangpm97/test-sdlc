import { describe, expect, it } from "vitest";
import { createHighlightRenderer } from "./highlight";

describe("createHighlightRenderer (FR-25)", () => {
  const render = createHighlightRenderer(
    "Bên B thanh toán trong vòng 30 ngày kể từ ngày nhận hóa đơn",
  );

  it("bọc <mark> quanh mẩu văn bản thuộc đoạn trích", () => {
    expect(render({ str: "thanh toán trong vòng" })).toBe(
      '<mark class="cite-hl">thanh toán trong vòng</mark>',
    );
  });

  it("không tô các mẩu quá ngắn hoặc không liên quan", () => {
    expect(render({ str: "30" })).toBe("30");
    expect(render({ str: "Điều 7. Bảo hành" })).toBe("Điều 7. Bảo hành");
  });

  it("escape HTML để tránh chèn mã", () => {
    expect(render({ str: "<img src=x>" })).toBe("&#60;img src=x&#62;");
  });
});
