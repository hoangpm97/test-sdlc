import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, validatePdf } from "./validate";

describe("validatePdf (FR-07)", () => {
  it("chấp nhận file có chữ ký %PDF-", async () => {
    const file = new File(["%PDF-1.7 nội dung"], "hop-dong.pdf", { type: "application/pdf" });
    expect(await validatePdf(file)).toBeNull();
  });

  it("từ chối file đổi đuôi .pdf nhưng không phải PDF (E-01)", async () => {
    const file = new File(["PK\u0003\u0004"], "gia-mao.pdf", { type: "application/pdf" });
    expect((await validatePdf(file))?.code).toBe("E-01");
  });

  it("từ chối file vượt 50 MB (E-02)", async () => {
    const file = new File(["%PDF-"], "lon.pdf");
    Object.defineProperty(file, "size", { value: MAX_FILE_BYTES + 1 });
    const issue = await validatePdf(file);
    expect(issue?.code).toBe("E-02");
    expect(issue?.message).toContain("lon.pdf");
  });
});
