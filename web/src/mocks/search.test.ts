import { describe, expect, it } from "vitest";
import { chunkPages, composeAnswer, search, tokenize } from "./search";

const pages = [
  {
    documentId: "d1",
    fileName: "hop-dong-X.pdf",
    page: 4,
    text: "Điều 5. Thanh toán. Bên B thanh toán trong vòng 30 ngày kể từ ngày nhận hóa đơn hợp lệ.",
  },
  {
    documentId: "d1",
    fileName: "hop-dong-X.pdf",
    page: 5,
    text: "Điều 6. Phạt chậm thanh toán là 0,05% mỗi ngày trên số tiền chậm trả.",
  },
  {
    documentId: "d2",
    fileName: "bao-cao-thi-truong.pdf",
    page: 1,
    text: "Thị trường phần mềm Việt Nam tăng trưởng 12% trong năm 2025.",
  },
];

describe("mock search", () => {
  it("bỏ từ dừng tiếng Việt khi tách từ", () => {
    expect(tokenize("Điều khoản thanh toán là gì?")).toEqual(["điều", "khoản", "thanh", "toán"]);
  });

  it("tìm đúng đoạn và trang liên quan", () => {
    const hits = search(chunkPages(pages), "thời hạn thanh toán hóa đơn");
    expect(hits[0]?.chunk.page).toBe(4);
    expect(hits.every((h) => h.chunk.documentId === "d1")).toBe(true);
  });

  it("trả lời có trích dẫn khớp với nội dung", () => {
    const hits = search(chunkPages(pages), "phạt chậm thanh toán");
    const answer = composeAnswer("phạt chậm thanh toán", hits);
    expect(answer.notFound).toBe(false);
    expect(answer.citations[0]).toMatchObject({ fileName: "hop-dong-X.pdf", page: 5 });
    expect(answer.content).toContain("[1]");
  });

  it("không khớp nhầm khi các từ khóa chỉ trùng âm tiết rời rạc", () => {
    const tricky = [
      {
        documentId: "d3",
        fileName: "bao-cao.pdf",
        page: 2,
        text: "Các đối thủ nước ngoài có giá cao. Khách hàng ưu tiên giải pháp đám mây.",
      },
    ];
    expect(search(chunkPages(tricky), "Thủ đô của nước Pháp là gì?")).toHaveLength(0);
  });

  it("trả về 'không tìm thấy' khi không có đoạn liên quan (BR-10)", () => {
    const answer = composeAnswer("thủ đô nước Pháp", search(chunkPages(pages), "thủ đô nước Pháp"));
    expect(answer.notFound).toBe(true);
    expect(answer.citations).toHaveLength(0);
  });
});
