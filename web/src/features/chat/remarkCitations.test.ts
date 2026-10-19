import { describe, expect, it } from "vitest";
import { remarkCitations, splitCitations } from "./remarkCitations";

describe("splitCitations", () => {
  it("tách số trích dẫn khỏi văn bản", () => {
    expect(splitCitations("Thanh toán 30 ngày [1], phạt 0,05% [2].")).toEqual([
      { type: "text", value: "Thanh toán 30 ngày " },
      { type: "cite", index: 1 },
      { type: "text", value: ", phạt 0,05% " },
      { type: "cite", index: 2 },
      { type: "text", value: "." },
    ]);
  });

  it("không đụng tới dấu ngoặc không phải trích dẫn", () => {
    expect(splitCitations("Mảng [a] và [")).toEqual([{ type: "text", value: "Mảng [a] và [" }]);
  });
});

describe("remarkCitations", () => {
  it("thay text node bằng node citation, bỏ qua inline code", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", value: "Xem [3]" },
            { type: "inlineCode", value: "[9]" },
          ],
        },
      ],
    };
    remarkCitations()(tree);
    const paragraph = tree.children[0] as { children: { type: string; data?: unknown }[] };
    expect(paragraph.children.map((c) => c.type)).toEqual(["text", "citation", "inlineCode"]);
    expect(paragraph.children[1]?.data).toEqual({ hName: "cite", hProperties: { dataIndex: 3 } });
  });
});
