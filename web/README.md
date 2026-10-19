# Chat với tài liệu – Web App

Frontend của MVP "Chat với tài liệu", xây dựng theo [docs/plan.md](../docs/plan.md).

## Chạy nhanh

```bash
npm install
npm run dev        # http://localhost:5173
```

Mặc định ứng dụng chạy ở **chế độ demo** (`VITE_USE_MOCKS=true` trong `.env`): toàn bộ backend được giả lập bằng MSW ngay trong trình duyệt.

- File PDF tải lên được **đọc văn bản thật** bằng PDF.js. Câu trả lời được ghép từ các đoạn tìm thấy theo từ khóa, kèm trích dẫn đúng file và đúng trang.
- **Chưa dùng AI thật.** Chất lượng câu trả lời chỉ mang tính minh họa.
- Dữ liệu chỉ nằm trong bộ nhớ, nên tải lại trang là mất.

Tài khoản demo (bấm vào trên trang đăng nhập để tự điền):

| Email | Mật khẩu | Vai trò |
|---|---|---|
| minh@congty.vn | matkhau123 | Chuyên viên BD |
| admin@congty.vn | admin12345 | Quản trị viên |
| huy@congty.vn | tam1234567 | Nhân viên mới (bắt buộc đổi mật khẩu) |

File PDF mẫu tiếng Việt nằm trong `e2e/fixtures/`.

Để nối với backend thật theo API ở SAD mục 5, đặt `VITE_USE_MOCKS=false` và proxy `/api/v1` tới server.

## Lệnh

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Kiểm tra kiểu + build production |
| `npm run check` | Typecheck + lint (Biome) + unit test (Vitest) |
| `npm run e2e` | E2E Playwright. Dùng trình duyệt có sẵn: `PW_CHANNEL=msedge npm run e2e`; lưu ảnh chụp: thêm `SHOTS_DIR=<thư mục>` |

## Cấu trúc

```
src/
├── app/            # router, App Shell, command palette, khoảnh khắc M5, store giao diện
├── features/
│   ├── auth/       # đăng nhập, đổi mật khẩu lần đầu
│   ├── chat/       # trang chat, luồng stream, trích dẫn, ô nhập, lời chào
│   ├── conversations/  # sidebar hội thoại, API
│   ├── documents/  # tải lên, trạng thái SSE, danh sách, chi tiết
│   ├── pdf-viewer/ # trình xem PDF (lazy), panel trích dẫn, tô sáng
│   └── admin/      # quản trị người dùng
├── shared/         # design system (ui), motion, lib, i18n, types
├── mocks/          # MSW handlers + bộ tìm kiếm giả lập
└── styles/app.css  # design tokens (Tailwind v4 @theme), sáng/tối, keyframes
```

## Công nghệ

React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 · TanStack Router & Query · Zustand · Motion · Radix UI (component kiểu shadcn) · react-pdf (PDF.js) · react-markdown · cmdk · Sonner · React Hook Form + Zod 4 · MSW 3 · Vitest · Playwright · Biome.
