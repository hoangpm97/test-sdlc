import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1440, height: 900 },
    locale: "vi-VN",
    // Dùng trình duyệt có sẵn trên máy (msedge / chrome) để không phải tải Chromium: PW_CHANNEL=msedge
    channel: process.env.PW_CHANNEL,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
