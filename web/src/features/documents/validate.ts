import { errorText } from "@/shared/i18n/errors";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;

export interface FileIssue {
  code: string;
  message: string;
}

/** Kiểm tra phía client trước khi tải lên (FR-07): định dạng (magic bytes) và dung lượng */
export async function validatePdf(file: File): Promise<FileIssue | null> {
  if (file.size > MAX_FILE_BYTES) {
    return { code: "E-02", message: errorText("E-02", { name: file.name }) };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== "%PDF-") {
    return { code: "E-01", message: errorText("E-01", { name: file.name }) };
  }
  return null;
}
