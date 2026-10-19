/** Danh mục thông báo lỗi theo SRS mục 4.8 */
const MESSAGES: Record<string, string> = {
  "E-01": "File {name} không phải PDF. Hiện chỉ hỗ trợ file .pdf.",
  "E-02": "File {name} vượt quá 50 MB.",
  "E-03": "File {name} có hơn 500 trang.",
  "E-04": "File {name} được bảo vệ bằng mật khẩu. Vui lòng gỡ mật khẩu rồi tải lên lại.",
  "E-05":
    "Không trích xuất được văn bản từ {name}. Có thể đây là PDF dạng ảnh scan, hiện chưa được hỗ trợ.",
  "E-06": "Bạn đã đạt giới hạn 100 tài liệu. Hãy xóa bớt tài liệu cũ để tiếp tục.",
  "E-07": "Xử lý file {name} thất bại. Vui lòng thử lại sau.",
  "E-10": "AI đang bận hoặc gặp sự cố. Vui lòng thử lại.",
  "E-11": "Bạn đã dùng hết số câu hỏi trong ngày. Hạn mức sẽ được làm mới lúc 0h.",
};

/** Lý do ngắn gọn hiển thị trên badge trạng thái tài liệu */
const SHORT: Record<string, string> = {
  "E-03": "Quá 500 trang",
  "E-04": "Có mật khẩu",
  "E-05": "PDF dạng ảnh scan",
  "E-07": "Xử lý thất bại",
};

export function errorText(code: string, vars: Record<string, string> = {}): string {
  const template = MESSAGES[code] ?? "Đã có lỗi xảy ra. Vui lòng thử lại.";
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function shortErrorText(code: string | null): string {
  return (code && SHORT[code]) ?? "Lỗi";
}
