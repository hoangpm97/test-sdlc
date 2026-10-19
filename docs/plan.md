# Kế hoạch phát triển giao diện (UI/UX) – "Chat với tài liệu"

| Thông tin | Chi tiết |
|---|---|
| Phiên bản | 1.0 |
| Ngày tạo | 19/10/2026 |
| Tài liệu nguồn | [BRD v1.1](BRD.md), [SRS](SRS.md), [SAD](SAD.md), [User Stories](USER_STORIES.md) |
| Phạm vi | Toàn bộ Web App (frontend) của MVP |
| Đối tượng đọc | Frontend developer, UI/UX designer, QA, Tech Lead |

---

## 1. Mục tiêu trải nghiệm

### 1.1. Từ yêu cầu nghiệp vụ đến nguyên tắc thiết kế

| Yêu cầu nghiệp vụ | Nguyên tắc UX | Thể hiện trên giao diện |
|---|---|---|
| BO-01: tra cứu dưới 2 phút | **Nhanh tới câu trả lời** | Màn hình chính là khung chat; phím tắt; câu trả lời hiện ngay khi có chữ đầu tiên |
| BO-02: tin cậy, kiểm chứng được | **Minh bạch nguồn** | Mỗi trích dẫn là một chip nổi bật, nhấp vào mở đúng trang PDF ngay bên cạnh, không rời màn hình chat |
| BO-03: được đội BD sử dụng | **Dễ chịu, tạo cảm hứng** | Giao diện sáng sủa, chuyển động mượt, có những khoảnh khắc "wow" nhỏ ở lần dùng đầu tiên |
| NFR-06: người mới dùng được trong 5 phút | **Tự giải thích** | Hướng dẫn theo ngữ cảnh ở trạng thái trống, câu hỏi gợi ý, không cần đọc tài liệu hướng dẫn |
| BR-10: không bịa đặt | **Trung thực về giới hạn** | Trạng thái "không tìm thấy" được thiết kế riêng: thân thiện, gợi ý cách hỏi lại, không giống lỗi |
| SP-01: phân loại dữ liệu | **Nhắc nhở nhẹ nhàng** | Lời nhắc chính sách ngay trong vùng tải lên, không dùng popup chặn thao tác |

### 1.2. Cá tính thương hiệu và giọng văn

- **Cá tính:** chuyên nghiệp, tin cậy, nhưng ấm áp. Giống một trợ lý giỏi, không phô trương.
- **Giọng văn tiếng Việt:** xưng "bạn", câu ngắn và chủ động.
  - Nên viết: "Đã sẵn sàng! Hãy hỏi bất cứ điều gì về 3 tài liệu này."
  - Tránh viết: "Quá trình xử lý tài liệu đã hoàn tất thành công."
- **Thông báo lỗi:** luôn nói rõ *chuyện gì xảy ra* và *bạn có thể làm gì*, dựa trên danh mục E-01 → E-11 trong SRS.

---

## 2. Công nghệ sử dụng

Kế thừa định hướng SPA trong SAD (ADR-07) và nâng cấp lên các phiên bản mới nhất. Phiên bản cụ thể được **chốt (pin) tại thời điểm khởi tạo dự án** bằng phiên bản ổn định mới nhất, sau đó chỉ nâng cấp có kiểm soát (Renovate).

| Hạng mục | Công nghệ | Lý do chọn |
|---|---|---|
| Framework | **React 19** + **TypeScript** (strict) | Hệ sinh thái lớn; React Compiler tự tối ưu re-render; `useOptimistic`, `useTransition` phù hợp với chat |
| Build tool | **Vite** (bản ổn định mới nhất) | Khởi động và HMR rất nhanh; cấu hình đơn giản cho SPA |
| Định tuyến | **TanStack Router** | Route an toàn kiểu dữ liệu (type-safe), search params có kiểu (phạm vi tài liệu, trang PDF), tải trước dữ liệu theo route |
| Dữ liệu server | **TanStack Query v5** | Cache, refetch, optimistic update cho danh sách tài liệu, hội thoại, đánh giá |
| State giao diện | **Zustand** | Gọn nhẹ cho state cục bộ: panel PDF, phạm vi chat, stream đang chạy |
| Styling | **Tailwind CSS v4** | Design token khai báo bằng CSS (`@theme`), hỗ trợ dark mode, container queries |
| Bộ component | **shadcn/ui** (nền Radix UI) | Copy vào repo nên tùy biến hoàn toàn; khả năng truy cập (a11y) tốt sẵn |
| Animation | **Motion** (motion.dev, trước đây là Framer Motion) | Animation khai báo, layout animation, `AnimatePresence`, spring vật lý, hỗ trợ reduced motion |
| Animation minh họa | **dotLottie** (`@lottiefiles/dotlottie-react`) | Minh họa động cho trạng thái trống và onboarding, file nhẹ |
| Icon | **Lucide** | Bộ icon nét mảnh, đồng bộ, tree-shakable |
| Toast | **Sonner** | Toast đẹp, xếp chồng mượt, đã tích hợp sẵn với shadcn/ui |
| Form | **React Hook Form** + **Zod** | Validate đồng bộ với schema API |
| Hiển thị Markdown | **react-markdown** + **remark-gfm** | Câu trả lời của AI có bảng, danh sách; render chip trích dẫn `[n]` bằng component tùy biến |
| Xem PDF | **react-pdf** (PDF.js) | Hiển thị theo trang, text layer để làm nổi bật đoạn trích (FR-25) |
| Danh sách dài | **TanStack Virtual** | Ảo hóa danh sách tin nhắn và tài liệu dài |
| Tải file | **react-dropzone** | Kéo-thả nhiều file, có validate phía client |
| Command palette | **cmdk** | Ctrl+K: tìm hội thoại, tài liệu, thao tác nhanh |
| Font | **Be Vietnam Pro** (UI) + **JetBrains Mono** (mã số) | Be Vietnam Pro được thiết kế riêng cho dấu tiếng Việt, hiển thị rõ và đẹp |
| Mock API | **MSW** (Mock Service Worker) | FE phát triển song song với BE, mock cả luồng SSE |
| Kiểm thử | **Vitest** + **Testing Library**, **Playwright**, **axe-core** | Unit/component, E2E, kiểm tra khả năng truy cập tự động |
| Tài liệu component | **Storybook** | Phát triển component độc lập, review UI với designer |
| Chất lượng code | **Biome** (lint + format) | Một công cụ thay cho ESLint và Prettier, chạy rất nhanh |

> **Lưu ý đồng bộ tài liệu:** SAD mục 2.3 ghi React 18. Cần cập nhật lên React 19 và bổ sung các thư viện ở trên khi plan này được duyệt.

---

## 3. Design System

### 3.1. Design tokens (khai báo trong `@theme` của Tailwind v4)

**Màu sắc** (hỗ trợ đầy đủ chế độ sáng và tối):

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `--color-brand` | Indigo 600 | Indigo 400 | Nút chính, liên kết, focus ring |
| `--color-brand-soft` | Indigo 50 | Indigo 950 | Nền tin nhắn của người dùng, nền chip trích dẫn |
| `--color-accent` | Violet → Sky (gradient) | Như bên trái, giảm độ sáng | Khoảnh khắc AI "đang suy nghĩ", hiệu ứng nổi bật |
| `--color-surface` / `--color-surface-2` | White / Slate 50 | Slate 950 / Slate 900 | Nền trang / nền panel |
| `--color-success` | Emerald 600 | Emerald 400 | Tài liệu sẵn sàng |
| `--color-warning` | Amber 600 | Amber 400 | Lời nhắc chính sách, gần hết hạn mức |
| `--color-danger` | Rose 600 | Rose 400 | Lỗi, thao tác xóa |
| `--color-highlight` | Yellow 200 / 60% | Yellow 500 / 30% | Làm nổi bật đoạn trích trong PDF |

Mọi cặp màu chữ/nền phải đạt tương phản **WCAG AA** (≥ 4.5:1 với chữ thường), được kiểm tra tự động trong Storybook.

**Chữ** (Be Vietnam Pro):

| Token | Cỡ / dòng | Dùng cho |
|---|---|---|
| `text-display` | 30/36, semibold | Lời chào ở màn hình trống |
| `text-title` | 20/28, semibold | Tiêu đề trang |
| `text-body` | 15/24, regular | Nội dung tin nhắn (dòng cao để đọc thoải mái với dấu tiếng Việt) |
| `text-small` | 13/20, medium | Metadata, chip trích dẫn |

**Khoảng cách và hình khối:**
- Khoảng cách theo lưới 4px.
- Bo góc: `--radius-sm` 6px (chip), `--radius-md` 10px (input, card), `--radius-lg` 16px (panel, bubble).
- Đổ bóng mềm 2 tầng; chế độ tối thay bóng bằng viền mảnh.

### 3.2. Phong cách hình ảnh

- **Bố cục thoáng:** nhiều khoảng trắng, nội dung chat rộng tối đa 760px để dễ đọc.
- **Hiệu ứng kính mờ có chọn lọc** (`backdrop-blur`): chỉ dùng cho thanh header dính và ô nhập liệu nổi, không lạm dụng.
- **Gradient nhẹ** violet → sky: chỉ dùng cho các yếu tố đại diện cho AI (avatar, chỉ báo đang suy nghĩ, viền ô nhập khi focus), giúp người dùng nhận diện "đây là AI".
- **Minh họa:** phong cách line-art đơn sắc theo màu brand, dùng cho trạng thái trống và onboarding.

---

## 4. Hệ thống chuyển động (Motion System)

### 4.1. Nguyên tắc

1. **Có mục đích:** mỗi chuyển động phải giúp người dùng *hiểu chuyện gì đang xảy ra* (trạng thái, quan hệ, nguyên nhân–kết quả), không chỉ để trang trí.
2. **Nhanh và nhẹ:** phần lớn chuyển động ≤ 250ms. Người dùng không bao giờ phải chờ animation chạy xong mới thao tác được.
3. **Ăn mừng đúng lúc:** chỉ dùng hiệu ứng "wow" ở các khoảnh khắc quan trọng như lần đầu tài liệu sẵn sàng hay câu trả lời đầu tiên. Không lặp lại liên tục.
4. **Tôn trọng người dùng:** với `prefers-reduced-motion`, mọi chuyển động dịch chuyển hoặc phóng to được thay bằng fade đơn giản (dùng `MotionConfig reducedMotion="user"`).
5. **Hiệu năng:** chỉ animate `transform` và `opacity`. Giữ 60fps trên laptop văn phòng phổ thông.

### 4.2. Motion tokens

| Token | Giá trị | Dùng cho |
|---|---|---|
| `duration-instant` | 100ms | Hover, nhấn nút |
| `duration-fast` | 180ms | Tooltip, dropdown, chip |
| `duration-base` | 250ms | Panel, tin nhắn xuất hiện |
| `duration-slow` | 400ms | Chuyển trang, khoảnh khắc ăn mừng |
| `ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Phần tử xuất hiện |
| `ease-in-soft` | `cubic-bezier(0.64, 0, 0.78, 0)` | Phần tử biến mất |
| `spring-snappy` | `{ type: "spring", stiffness: 400, damping: 30 }` | Chip, nút, toggle |
| `spring-gentle` | `{ type: "spring", stiffness: 200, damping: 26 }` | Panel PDF, layout thay đổi |

Các token được khai báo một lần trong `src/shared/motion/tokens.ts` và dùng lại ở mọi nơi.

### 4.3. Danh mục chuyển động theo khoảnh khắc

| # | Khoảnh khắc | Chuyển động | Mục đích |
|---|---|---|---|
| M1 | Kéo file vào vùng tải lên | Vùng thả "thở" nhẹ (scale 1 → 1.02), viền nét đứt chạy vòng quanh, icon tài liệu nảy lên | Cho biết "thả vào đây được" |
| M2 | Thả file | Từng thẻ file bay vào danh sách theo thứ tự (stagger 40ms), thanh tiến trình chạy mượt | Mỗi file có trạng thái riêng (FR-08) |
| M3 | Đang xử lý | Hiệu ứng shimmer gradient chạy trên thẻ file kèm nhãn lần lượt "Đang đọc nội dung… → Đang phân tích… → Sắp xong…" | Giảm cảm giác chờ, cho thấy hệ thống đang làm việc |
| M4 | Tài liệu sẵn sàng | Icon chuyển từ spinner sang dấu ✓ (vẽ nét bằng path animation) kèm nhịp sáng màu success | Phản hồi tích cực rõ ràng |
| M5 | **Lần đầu tiên** có tài liệu sẵn sàng | Hiệu ứng hạt (particles) nhẹ nhàng trong khoảng 1 giây, kèm thẻ "Bạn đã sẵn sàng! Thử hỏi: …" trượt lên với 3 câu hỏi gợi ý | Khoảnh khắc "aha": dẫn ngay tới giá trị cốt lõi |
| M6 | Gửi câu hỏi | Bubble câu hỏi bay từ ô nhập lên vị trí trong luồng chat (layout animation), ô nhập co lại mượt | Liên kết hành động với kết quả |
| M7 | AI đang tìm kiếm | Avatar AI có vòng gradient xoay chậm; 3 chấm nhảy; nhãn "Đang tìm trong 12 tài liệu…" | Minh bạch quá trình, giảm cảm giác chờ |
| M8 | Câu trả lời đang stream | Chữ xuất hiện dần với hiệu ứng fade theo từng cụm từ (không giật từng ký tự), con trỏ nhấp nháy ở cuối | Cảm giác tự nhiên, dễ đọc khi đang stream |
| M9 | Trích dẫn xuất hiện | Các chip `[1] [2]` pop-in theo thứ tự (spring-snappy); danh sách nguồn mở ra bên dưới | Nhấn mạnh tính kiểm chứng (BO-02) |
| M10 | Rê chuột vào chip trích dẫn | Hover card hiện đoạn trích + tên file + số trang, kèm thumbnail trang PDF | Xem nhanh nguồn mà không cần nhấp |
| M11 | Nhấp chip trích dẫn | Panel PDF trượt vào từ phải (spring-gentle); trang cuộn tới vị trí trích; đoạn trích được tô sáng dần như bút dạ quang lướt qua | Khoảnh khắc "wow" về tính minh bạch (FR-25) |
| M12 | Trả lời "không tìm thấy" | Minh họa kính lúp nhỏ lắc nhẹ, kèm gợi ý cách hỏi lại dạng chip có thể bấm | Thân thiện, không giống lỗi (BR-10) |
| M13 | Đánh giá 👍 | Icon nảy lên kèm vài hạt nhỏ bay ra | Ghi nhận và khuyến khích đóng góp |
| M14 | Đánh giá 👎 | Ô góp ý mở ra mượt (height auto animation) | Giảm ma sát khi góp ý |
| M15 | Xóa tài liệu hoặc hội thoại | Phần tử thu gọn và mờ dần, các phần tử còn lại dồn lên (layout animation); toast có nút "Hoàn tác" trong 5 giây | Rõ ràng, giảm rủi ro xóa nhầm |
| M16 | Chuyển trang | Cross-fade + trượt nhẹ 8px giữa các route | Mượt mà, không bị "nháy" trắng |
| M17 | Màn hình đăng nhập | Nền gradient mesh chuyển màu chậm (40 giây/vòng); các "tấm tài liệu" mờ trôi nhẹ phía sau | Ấn tượng đầu tiên hiện đại |
| M18 | Lời chào ở hội thoại mới | "Chào buổi sáng, Minh 👋" xuất hiện từng chữ, sau đó các câu hỏi gợi ý stagger lên | Cá nhân hóa, tạo cảm hứng bắt đầu |
| M19 | Ô nhập khi focus | Viền gradient sáng dần lên | Thể hiện "AI đang lắng nghe" |

**Ngân sách hiệu ứng "wow":** tối đa **1 hiệu ứng ăn mừng (M5, M13) mỗi phiên** cho mỗi loại. Trạng thái "đã xem" được lưu trong localStorage để không lặp lại gây khó chịu.

---

## 5. Kiến trúc thông tin và điều hướng

### 5.1. Sơ đồ route

```
/login                         SCR-01  Đăng nhập
/change-password               Đổi mật khẩu lần đầu (FR-05)
/                              → chuyển tới /chat
/chat                          SCR-02  Hội thoại mới (lời chào + gợi ý)
/chat/$conversationId          SCR-02  Hội thoại cụ thể
    ?scope=docId1,docId2       Phạm vi tài liệu (FR-22)
    &doc=docId&page=4          Panel PDF đang mở (FR-25) – chia sẻ được qua URL
/documents                     SCR-03  Danh sách tài liệu + tải lên
/documents/$documentId         SCR-04  Chi tiết tài liệu (xem PDF, tóm tắt)
/admin/users                   SCR-05  Quản trị người dùng (chỉ role admin)
/*                             Trang 404 thân thiện
```

### 5.2. Bố cục khung ứng dụng (App Shell)

```
┌─────────────┬────────────────────────────────────────┬──────────────────┐
│  Sidebar    │  Header: tiêu đề · phạm vi · Ctrl+K     │                  │
│  (thu gọn   │────────────────────────────────────────│   Panel PDF      │
│   được)     │                                        │   (mở khi cần,   │
│             │           Nội dung chính               │   kéo để đổi     │
│  + Mới      │           (max-width 760px)            │   độ rộng)       │
│  Hội thoại  │                                        │                  │
│  …          │                                        │                  │
│  ─────────  │────────────────────────────────────────│                  │
│  📄 Tài liệu│  Ô nhập nổi (glass) + gợi ý            │                  │
│  👤 Tài khoản│                                        │                  │
└─────────────┴────────────────────────────────────────┴──────────────────┘
```

- **Responsive:**
  - ≥ 1280px: đủ 3 cột.
  - 1024–1279px: panel PDF che lên nội dung (overlay).
  - 768–1023px: sidebar thành drawer.
  - < 768px: chỉ hỗ trợ cơ bản (theo SRS 3.3).
- Panel PDF và sidebar có thể đổi kích thước bằng kéo thả. Kích thước được nhớ trong localStorage.

### 5.3. Phím tắt

| Phím | Hành động |
|---|---|
| `Ctrl/⌘ + K` | Mở command palette: tìm hội thoại, tài liệu, thao tác |
| `/` | Focus ô nhập câu hỏi |
| `Ctrl/⌘ + Shift + O` | Hội thoại mới |
| `Ctrl/⌘ + U` | Tải tài liệu lên |
| `Esc` | Đóng panel PDF, dừng câu trả lời đang stream |
| `Enter` / `Shift + Enter` | Gửi / xuống dòng |
| `↑` (khi ô nhập trống) | Sửa câu hỏi vừa gửi |

---

## 6. Đặc tả từng màn hình

Mỗi màn hình phải thiết kế đủ **5 trạng thái**: đang tải (skeleton), trống, có dữ liệu, lỗi, và các trạng thái đặc thù.

### 6.1. SCR-01 – Đăng nhập (US-101 → 104)

- **Bố cục:** chia đôi. Bên trái là form. Bên phải là nền gradient động (M17) với slogan theo tầm nhìn sản phẩm: *"Hỏi bất cứ điều gì. Nhận câu trả lời kèm bằng chứng."*
- Form gồm email và mật khẩu (có nút hiện/ẩn); validate bằng Zod; lỗi hiển thị ngay dưới trường nhập.
- **Khóa tài khoản** (FR-04): hiển thị đồng hồ đếm ngược thời gian còn lại.
- **Đổi mật khẩu lần đầu:** thanh đo độ mạnh mật khẩu có animation và checklist điều kiện, mỗi điều kiện tự tích ✓ khi đạt.

### 6.2. SCR-02 – Chat (màn hình chính; US-301 → 309, 401 → 403, 501)

| Thành phần | Mô tả |
|---|---|
| **Lời chào (hội thoại mới)** | Lời chào theo buổi trong ngày và tên người dùng (M18); dòng "Bạn có 12 tài liệu sẵn sàng"; 3–5 câu hỏi gợi ý dạng thẻ (FR-27) |
| **Bộ chọn phạm vi** | Nút "Tất cả tài liệu (12) ▾" mở popover có ô tìm kiếm và checkbox. Khi đã chọn, hiển thị chip tên tài liệu, có thể xóa từng chip (FR-22) |
| **Bubble người dùng** | Căn phải, nền `brand-soft`. Hover hiện nút sửa và sao chép |
| **Bubble AI** | Căn trái, không có nền (để nội dung thoáng), avatar gradient. Hiển thị Markdown (bảng, danh sách). Chip trích dẫn `[n]` nằm ngay trong câu |
| **Danh sách nguồn** | Dưới câu trả lời là các thẻ nguồn nhỏ (icon PDF, tên file, "tr. 4"). Thu gọn khi có hơn 3 nguồn |
| **Thanh hành động** | 👍 👎 📋 Sao chép, 🔄 Hỏi lại. Hiện khi hover hoặc khi focus bàn phím |
| **Đang stream** | Nút "Dừng" thay thế nút Gửi; tin nhắn đã dừng có nhãn "Đã dừng" (FR-23) |
| **Ô nhập** | Nổi ở đáy, hiệu ứng kính mờ, tự giãn chiều cao (tối đa 8 dòng), bộ đếm ký tự hiện khi > 1.800/2.000 ký tự, chỉ báo hạn mức còn lại trong ngày khi < 20 câu (BR-32) |
| **Chưa có tài liệu** (FR-26) | Ô nhập bị vô hiệu hóa, ở giữa màn hình là minh họa Lottie kèm nút lớn "Tải tài liệu đầu tiên" |
| **Lỗi** (E-10, E-11) | Thẻ lỗi nằm ngay trong luồng chat, có nút "Thử lại". Không dùng popup |
| **Tài liệu đã xóa** (FR-14) | Chip trích dẫn bị gạch ngang, tooltip "Tài liệu đã bị xóa" |

**Sidebar hội thoại:** nhóm theo "Hôm nay / Hôm qua / 7 ngày trước / Cũ hơn". Đổi tên trực tiếp (double-click). Menu "…" có mục Xóa (hộp thoại xác nhận + toast Hoàn tác). Tiêu đề hội thoại mới xuất hiện với hiệu ứng gõ chữ khi được tự sinh.

### 6.3. Panel xem PDF (FR-15, FR-25; US-206, 306)

- Trượt vào từ phải (M11). Header gồm tên file, số trang hiện tại / tổng số trang, phóng to/thu nhỏ, mở toàn màn hình, đóng.
- Render **lazy** từng trang bằng react-pdf, có text layer. Đoạn trích được tô bằng `--color-highlight` với animation "bút dạ quang".
- Có dải thumbnail trang ở cạnh (có thể ẩn).
- Trạng thái panel được đồng bộ với URL (`?doc=&page=`) để nút Back của trình duyệt hoạt động đúng.

### 6.4. SCR-03 – Tài liệu (US-201 → 205, 208)

- **Vùng tải lên:** ở đầu trang, hoặc thả file vào **bất kỳ đâu trong ứng dụng** (overlay toàn màn hình khi kéo file vào cửa sổ). Có lời nhắc chính sách SP-01 dạng dòng chữ nhỏ có icon khiên.
- **Validate phía client** trước khi gửi: định dạng, dung lượng, số file ≤ 10. File lỗi hiện ngay trên thẻ với mã E-01/E-02.
- **Danh sách:** chuyển đổi giữa dạng bảng và dạng lưới thẻ (thẻ có thumbnail trang đầu). Có tìm kiếm tức thì, sắp xếp theo tên hoặc ngày, và lọc theo trạng thái.
- **Badge trạng thái động:**
  - `Đang tải lên 45%`: thanh tiến trình.
  - `Đang xử lý`: shimmer (M3).
  - `Sẵn sàng`: dấu ✓ (M4).
  - `Lỗi`: màu danger + tooltip lý do + nút "Thử lại" hoặc "Xóa".
- **Chọn nhiều:** chọn nhiều tài liệu → thanh hành động nổi trượt lên từ đáy với hai nút "Hỏi về X tài liệu này" và "Xóa".
- **File trùng** (FR-11): hộp thoại hỏi "Bỏ qua" hoặc "Vẫn tải lên".

### 6.5. SCR-04 – Chi tiết tài liệu (US-207)

- Bên trái: trình xem PDF. Bên phải: thẻ **Tóm tắt** (fade-in khi sẵn sàng; skeleton khi đang tạo) và **Ý chính** (dạng danh sách có icon, stagger).
- Nút chính **"Hỏi về tài liệu này"**: tạo hội thoại với phạm vi là tài liệu đó, chuyển trang bằng shared-element transition (thẻ tài liệu "bay" thành chip phạm vi).

### 6.6. SCR-05 – Quản trị người dùng (US-601, 602)

- Bảng người dùng có lọc theo trạng thái. Form tạo người dùng mở dạng sheet trượt từ phải.
- Thẻ số liệu: số câu hỏi hôm nay, số token trong tháng, % ngân sách đã dùng (thanh tiến trình đổi màu khi vượt 80%).
- Admin không có giao diện xem nội dung tài liệu hay hội thoại (SP-02).

### 6.7. Onboarding lần đầu

Thay vì tour nhiều bước, dùng **3 điểm chạm theo ngữ cảnh**:
1. Chưa có tài liệu → minh họa và nút "Tải tài liệu đầu tiên".
2. Tài liệu đầu tiên sẵn sàng → khoảnh khắc M5 kèm câu hỏi gợi ý.
3. Câu trả lời đầu tiên có trích dẫn → tooltip một lần: "Nhấp vào [1] để xem đúng đoạn gốc trong tài liệu."

Mục tiêu: người dùng mới hoàn thành chuỗi "tải lên → hỏi → mở trích dẫn" trong ≤ 5 phút (NFR-06).

---

## 7. Kiến trúc mã nguồn frontend

### 7.1. Cấu trúc thư mục (theo tính năng)

```
web/
├── src/
│   ├── app/                    # khởi tạo app, providers, router, App Shell
│   ├── routes/                 # file-based routes (TanStack Router)
│   ├── features/
│   │   ├── auth/               # login, change-password, session guard
│   │   ├── chat/
│   │   │   ├── components/     # MessageList, MessageBubble, CitationChip,
│   │   │   │                   # SourceList, Composer, ScopePicker, Greeting
│   │   │   ├── hooks/          # useChatStream, useConversation
│   │   │   └── api.ts
│   │   ├── conversations/      # Sidebar, ConversationItem
│   │   ├── documents/          # Dropzone, DocumentTable, DocumentCard,
│   │   │                       # StatusBadge, useDocumentEvents
│   │   ├── pdf-viewer/         # PdfPanel, PdfPage, HighlightLayer
│   │   ├── feedback/
│   │   └── admin/
│   ├── shared/
│   │   ├── ui/                 # component shadcn/ui đã tùy biến
│   │   ├── motion/             # tokens, variants, Celebrate, ShimmerText
│   │   ├── lib/                # apiClient, sseClient, formatters (vi-VN)
│   │   ├── i18n/               # chuỗi giao diện tiếng Việt, mã lỗi E-xx
│   │   └── hooks/
│   ├── mocks/                  # MSW handlers + dữ liệu mẫu
│   └── styles/                 # app.css (@theme tokens)
├── .storybook/
└── e2e/                        # Playwright
```

### 7.2. Luồng dữ liệu quan trọng

| Luồng | Cách xử lý |
|---|---|
| **Stream câu trả lời** (SAD 5.3) | Hook `useChatStream` dùng `fetch` + `ReadableStream` để đọc SSE từ POST (EventSource không hỗ trợ POST). Các event `token` được gom theo `requestAnimationFrame` rồi mới cập nhật state, tránh re-render quá dày. `AbortController` cho nút Dừng. Khi nhận `done`, ghi vào cache của TanStack Query |
| **Trạng thái tài liệu** | `useDocumentEvents` mở một kết nối SSE `/documents/events` duy nhất cho toàn app. Mỗi event cập nhật trực tiếp cache `['documents']`. Tự kết nối lại với backoff khi mất kết nối |
| **Gửi câu hỏi** | `useOptimistic`: bubble câu hỏi hiện ngay trước khi server phản hồi |
| **Đánh giá, xóa, đổi tên** | Optimistic update + rollback khi lỗi + toast |
| **Phạm vi và panel PDF** | Lưu trong search params của URL (TanStack Router), không lưu trong state |
| **Xác thực** | Cookie session; `apiClient` gặp 401 thì chuyển về `/login?redirect=…` |
| **Tải file lên** | `XMLHttpRequest`/axios có `onUploadProgress` để hiện tiến trình cho từng file; tải song song tối đa 3 file |

### 7.3. Hiển thị trích dẫn

Câu trả lời được render bằng react-markdown với một plugin remark tùy biến. Plugin này chuyển `[n]` thành node `citation`, rồi render thành `<CitationChip index={n} />`. Chip tra dữ liệu nguồn từ event `citations`. Trong lúc đang stream (chưa có event citations), chip hiển thị ở trạng thái chờ (skeleton nhỏ), sau đó pop-in khi có dữ liệu (M9).

---

## 8. Khả năng truy cập (Accessibility)

- Mục tiêu **WCAG 2.2 mức AA**. `axe-core` chạy trong Storybook và Playwright; lỗi mức serious/critical làm CI thất bại.
- Toàn bộ thao tác chính dùng được bằng bàn phím; focus ring rõ ràng; có "Skip to content".
- Luồng chat dùng `role="log"` + `aria-live="polite"`. Khi stream, chỉ thông báo cho trình đọc màn hình **khi câu trả lời hoàn tất**, tránh đọc từng token.
- Chip trích dẫn có `aria-label="Nguồn 1: hop-dong-X.pdf, trang 4"`.
- Animation tuân thủ `prefers-reduced-motion`; không có nội dung nhấp nháy quá 3 lần/giây.
- Hỗ trợ phóng to 200% mà không vỡ bố cục.

---

## 9. Hiệu năng

| Chỉ số | Ngân sách |
|---|---|
| LCP (màn hình chat, mạng văn phòng) | ≤ 2,0 giây |
| INP | ≤ 200ms |
| CLS | ≤ 0,05 |
| JS ban đầu (gzip) | ≤ 200 KB |
| Animation | 60fps, không có long task > 50ms khi đang stream |

**Biện pháp:**
- Tách code theo route.
- **Lazy-load** react-pdf và PDF.js worker (thư viện nặng nhất), Lottie, cmdk và trang admin.
- Ảo hóa danh sách tin nhắn và tài liệu khi vượt 100 mục.
- Gom token stream theo frame (mục 7.2).
- Tự host font, subset `latin` + `vietnamese`, `font-display: swap`.
- Kiểm tra bundle size trong CI (`size-limit`).

---

## 10. Chiến lược kiểm thử UI

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Unit | Vitest | Parser trích dẫn, gom token stream, validate file, formatter ngày giờ và dung lượng theo vi-VN |
| Component | Vitest + Testing Library | Composer, CitationChip, Dropzone, StatusBadge, ScopePicker: đủ các trạng thái |
| Visual | Storybook + chụp ảnh so sánh (Playwright screenshot) | Mọi component ở chế độ sáng/tối và các trạng thái chính |
| Truy cập | axe-core | Tự động trên mọi story và trang E2E |
| E2E | Playwright + MSW (hoặc staging) | UC-01 tải lên, UC-02 hỏi đáp và mở trích dẫn, UC-03 xóa; kịch bản stream bị dừng; mất kết nối SSE |
| Khả dụng | Kiểm thử với 5 người dùng BD | Đo NFR-06: hoàn thành chuỗi tác vụ trong ≤ 5 phút |

---

## 11. Lộ trình triển khai

Bám theo kế hoạch sprint trong [USER_STORIES.md](USER_STORIES.md) mục 4. Nhờ MSW, FE không bị chặn bởi BE.

### Sprint 0 (tuần 1–2): Nền móng và Design System
- [ ] Khởi tạo dự án: Vite + React 19 + TS strict + Biome + Vitest + Storybook + MSW.
- [ ] Cài Tailwind v4, khai báo design tokens (màu, chữ, bo góc, bóng) cho cả sáng và tối.
- [ ] Cài font Be Vietnam Pro (subset tiếng Việt).
- [ ] Thêm các component shadcn/ui cơ bản và tùy biến theo token: Button, Input, Textarea, Dialog, Sheet, Popover, Tooltip, HoverCard, DropdownMenu, Checkbox, Badge, Skeleton, Sonner.
- [ ] Viết motion tokens, variants dùng chung và `MotionConfig reducedMotion="user"`.
- [ ] Dựng App Shell: sidebar thu gọn được, header, khung panel bên phải có thể đổi kích thước.
- [ ] Cấu hình router, auth guard, `apiClient`, trang 404.
- [ ] SCR-01 Đăng nhập + đổi mật khẩu lần đầu (M17).
- [ ] Viết MSW handlers cho auth, documents, conversations (gồm cả mock SSE).
- [ ] Thiết lập CI: lint, type-check, test, build, kiểm tra bundle size.
- [ ] **Designer:** hoàn thiện mockup hi-fi cho SCR-02, SCR-03 và bộ minh họa trạng thái trống.

### Sprint 1 (tuần 3–4): Luồng tải lên → hỏi đáp chạy được
- [ ] SCR-03: Dropzone (cả vùng thả toàn ứng dụng), validate phía client, tiến trình từng file (M1, M2).
- [ ] `useDocumentEvents` (SSE) + StatusBadge động (M3, M4).
- [ ] Danh sách tài liệu: dạng bảng, tìm kiếm, sắp xếp.
- [ ] SCR-02: MessageList, MessageBubble, Composer, render Markdown.
- [ ] `useChatStream`: đọc SSE từ POST, gom token theo frame, nút Dừng (M6, M7, M8).
- [ ] Trạng thái chưa có tài liệu (FR-26) + trạng thái lỗi E-10.
- [ ] Tích hợp API thật của BE trên staging.
- [ ] **Demo nội bộ** cuối sprint.

### Sprint 2 (tuần 5–6): Tin cậy và trải nghiệm chat
- [ ] Plugin trích dẫn: CitationChip, SourceList, HoverCard xem trước (M9, M10).
- [ ] Trạng thái "không tìm thấy" được thiết kế riêng (M12).
- [ ] Sidebar hội thoại: nhóm theo thời gian, tạo mới, mở lại, tiêu đề tự sinh.
- [ ] Xóa tài liệu: chọn nhiều, thanh hành động nổi, layout animation + Hoàn tác (M15).
- [ ] Lời chào và câu hỏi gợi ý (M18), viền gradient của ô nhập (M19).
- [ ] Phím tắt cơ bản (`/`, `Esc`, `Enter`).
- [ ] Bộ test E2E cho UC-01 → UC-03.

### Sprint 3 (tuần 7–8): Hoàn thiện và chuẩn bị pilot
- [ ] Panel PDF: lazy-load, mở đúng trang, tô sáng đoạn trích (M11), đồng bộ với URL.
- [ ] SCR-04 Chi tiết tài liệu: tóm tắt, ý chính, shared-element transition "Hỏi về tài liệu này".
- [ ] Bộ chọn phạm vi tài liệu (ScopePicker).
- [ ] Đánh giá 👍/👎 + ô góp ý (M13, M14).
- [ ] Đổi tên và xóa hội thoại.
- [ ] SCR-05 Quản trị người dùng + thẻ số liệu sử dụng.
- [ ] Onboarding 3 điểm chạm + khoảnh khắc lần đầu (M5).
- [ ] Command palette Ctrl+K.
- [ ] Rà soát a11y (axe, bàn phím, trình đọc màn hình NVDA) và hiệu năng (Lighthouse, ngân sách mục 9).
- [ ] Kiểm thử khả dụng với 5 người dùng BD, sửa các vấn đề phát hiện được.
- [ ] Hỗ trợ UAT.

### Backlog (nếu còn năng lực)
- [ ] Xuất câu trả lời ra Markdown (BR-22).
- [ ] Dạng lưới thẻ có thumbnail cho danh sách tài liệu.
- [ ] Chủ đề màu tùy chỉnh theo người dùng.

---

## 12. Definition of Done cho UI

Một màn hình hoặc component được coi là xong khi:

- [ ] Đúng mockup đã duyệt ở cả chế độ sáng và tối.
- [ ] Có đủ các trạng thái: tải, trống, có dữ liệu, lỗi, và trạng thái đặc thù.
- [ ] Có story trong Storybook; test component đạt; axe không có lỗi serious.
- [ ] Dùng được hoàn toàn bằng bàn phím; hoạt động đúng với `prefers-reduced-motion`.
- [ ] Chữ hiển thị đúng tiếng Việt và theo đúng giọng văn ở mục 1.2.
- [ ] Không vượt ngân sách hiệu năng ở mục 9.
- [ ] Đạt tiêu chí chấp nhận của user story tương ứng.

---

## 13. Rủi ro và câu hỏi mở

| # | Vấn đề | Đề xuất |
|---|---|---|
| 1 | Animation quá nhiều có thể gây phân tâm trong công cụ làm việc | Giữ ngân sách "wow" (mục 4.3); thu thập phản hồi trong pilot; có tùy chọn "Giảm chuyển động" trong menu tài khoản |
| 2 | Tô sáng đoạn trích trong PDF có thể không khớp chính xác (PDF nhiều cột, bảng) | Khớp mờ (fuzzy match) trên text layer; nếu không khớp thì chỉ mở đúng trang (đúng như FR-25 cho phép) |
| 3 | Stream nhiều token gây giật khi danh sách tin nhắn dài | Gom token theo frame + ảo hóa danh sách; đo bằng React Profiler |
| 4 | Thư viện mới nâng cấp nhanh, dễ có breaking change | Pin phiên bản, nâng cấp qua Renovate theo lịch, có Storybook visual test làm lưới an toàn |
| 5 | Chưa có designer chuyên trách? | Cần xác nhận. Nếu không có, FE dựng UI trực tiếp từ design system và wireframe trong SRS mục 5.2, review với đội BD mỗi sprint |
| 6 | Màu thương hiệu công ty | Cần xác nhận. Plan đang dùng Indigo làm tạm; chỉ cần đổi token ở mục 3.1 |
