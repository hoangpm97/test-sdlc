function compact(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/**
 * Tạo hàm customTextRenderer cho react-pdf: bọc <mark> quanh các mẩu văn bản
 * thuộc đoạn trích (khớp mờ theo từng text item – plan mục 13, rủi ro 2).
 */
export function createHighlightRenderer(snippet: string) {
  const target = compact(snippet.replace(/…$/, ""));
  return ({ str }: { str: string }) => {
    const piece = compact(str);
    const matches = piece.length >= 4 && target.includes(piece);
    return matches ? `<mark class="cite-hl">${escapeHtml(str)}</mark>` : escapeHtml(str);
  };
}
