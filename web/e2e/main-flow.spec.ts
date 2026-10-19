import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Luồng chính UC-01 → UC-03 trên chế độ demo (MSW):
 * đăng nhập → tải PDF → hỏi đáp có trích dẫn → mở đúng trang → câu hỏi ngoài phạm vi.
 * Đặt SHOTS_DIR để lưu ảnh chụp màn hình từng bước.
 */
const fixtures = path.join(import.meta.dirname, "fixtures");
const shotsDir = process.env.SHOTS_DIR;

async function shot(page: Page, name: string) {
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
}

test("tải tài liệu, hỏi đáp và kiểm chứng trích dẫn", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Chào mừng trở lại" })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, "01-login");

  // Đăng nhập bằng tài khoản demo
  await page.getByRole("button", { name: /minh@congty\.vn/ }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/chat/);
  await expect(page.getByText("Tải tài liệu đầu tiên để bắt đầu")).toBeVisible();
  await shot(page, "02-chat-empty");

  // UC-01: tải lên 2 file PDF
  await page.goto("/documents");
  await page
    .getByLabel("Chọn file PDF")
    .setInputFiles([
      path.join(fixtures, "hop-dong-dai-phat.pdf"),
      path.join(fixtures, "bao-cao-thi-truong-2026.pdf"),
    ]);
  await expect(page.getByText(/Đang (đọc|phân tích|tạo)/).first()).toBeVisible();
  await shot(page, "03-documents-processing");

  // Khoảnh khắc "tài liệu đầu tiên sẵn sàng" (M5)
  await expect(page.getByRole("dialog", { name: "Tài liệu đầu tiên đã sẵn sàng" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Sẵn sàng", { exact: true })).toHaveCount(2);
  await page.waitForTimeout(600);
  await shot(page, "04-documents-ready-celebration");
  await page.getByRole("dialog", { name: "Tài liệu đầu tiên đã sẵn sàng" }).getByLabel("Đóng").click();

  // Lời chào + câu hỏi gợi ý
  await page.getByRole("link", { name: "Hội thoại mới" }).click();
  await expect(page.getByText(/tài liệu sẵn sàng/)).toBeVisible();
  await page.waitForTimeout(1500);
  await shot(page, "05-greeting");

  // UC-02: hỏi và nhận câu trả lời có trích dẫn
  const composer = page.getByRole("textbox", { name: "Câu hỏi" });
  await composer.fill("Điều khoản thanh toán và phạt chậm trả với Đại Phát?");
  await composer.press("Enter");
  await expect(page).toHaveURL(/\/chat\/conv_/);
  await expect(page.getByText("Nguồn", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Nguồn 1: hop-dong-dai-phat\.pdf/ }).first()).toBeVisible();
  await page.waitForTimeout(500);
  await shot(page, "06-answer-with-citations");

  // Mở trích dẫn → panel PDF đúng trang, đoạn trích được tô sáng (M11)
  await page.getByRole("button", { name: /^Nguồn 1:/ }).first().click();
  await expect(page).toHaveURL(/doc=doc_.*page=\d/);
  await expect(page.locator("mark.cite-hl").first()).toBeInViewport();
  await page.waitForTimeout(1200);
  await shot(page, "07-pdf-panel-highlight");

  // Câu hỏi ngoài phạm vi → "không tìm thấy" (BR-10)
  await page.keyboard.press("Escape");
  await composer.fill("Thủ đô của nước Pháp là gì?");
  await composer.press("Enter");
  await expect(page.getByText("Không tìm thấy thông tin trong tài liệu")).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, "08-not-found");

  // Giao diện tối
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(400);
  await shot(page, "09-dark-mode");

  // Command palette
  await page.keyboard.press("Control+K");
  await expect(page.getByPlaceholder("Tìm hội thoại, tài liệu, thao tác…")).toBeVisible();
  await page.waitForTimeout(300);
  await shot(page, "10-command-palette");
});
