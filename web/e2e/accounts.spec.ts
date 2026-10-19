import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const shotsDir = process.env.SHOTS_DIR;
async function shot(page: Page, name: string) {
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${name}.png`) });
}

async function loginAs(page: Page, email: RegExp) {
  await page.goto("/login");
  await page.getByRole("button", { name: email }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

test("nhân viên mới phải đổi mật khẩu tạm ở lần đăng nhập đầu (FR-05)", async ({ page }) => {
  await loginAs(page, /huy@congty\.vn/);
  await expect(page).toHaveURL(/\/change-password/);
  await page.getByLabel("Mật khẩu mới").fill("MatKhauMoi2026!");
  await page.getByLabel("Xác nhận mật khẩu").fill("MatKhauMoi2026!");
  await expect(page.getByText("Rất mạnh")).toBeVisible();
  await shot(page, "11-change-password");
  await page.getByRole("button", { name: "Lưu và tiếp tục" }).click();
  await expect(page).toHaveURL(/\/chat/);
});

test("đăng nhập sai hiển thị lỗi, quản trị viên xem được trang quản trị", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("minh@congty.vn");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("sai-mat-khau");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu không đúng" })).toBeVisible();

  await loginAs(page, /admin@congty\.vn/);
  await page.getByRole("link", { name: "Quản trị" }).click();
  await expect(page.getByRole("heading", { name: "Quản trị người dùng" })).toBeVisible();
  await expect(page.getByText("Ngân sách AI tháng này")).toBeVisible();
  await expect(page.getByRole("cell", { name: /Trần Thị Lan/ })).toBeVisible();
  await page.waitForTimeout(900);
  await shot(page, "12-admin");

  await page.getByRole("button", { name: "Tạo người dùng" }).click();
  await page.getByLabel("Họ và tên").fill("Đỗ Thu Hà");
  await page.getByLabel("Email công ty").fill("ha@congty.vn");
  await page.getByLabel("Mật khẩu tạm").fill("tamthoi12345");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("cell", { name: /Đỗ Thu Hà/ })).toBeVisible();
});
