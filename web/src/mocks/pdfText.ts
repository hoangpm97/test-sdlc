import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type PdfErrorCode = "E-03" | "E-04" | "E-05" | "E-07";

export class PdfReadError extends Error {
  constructor(public code: PdfErrorCode) {
    super(code);
  }
}

const MAX_PAGES = 500;
const MIN_AVG_CHARS = 50;

/** Trích xuất văn bản theo từng trang (FR-10: phát hiện PDF scan) */
export async function extractPages(buffer: ArrayBuffer): Promise<string[]> {
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  let pdf: Awaited<typeof task.promise>;
  try {
    pdf = await task.promise;
  } catch (error) {
    if ((error as { name?: string }).name === "PasswordException") throw new PdfReadError("E-04");
    throw new PdfReadError("E-07");
  }

  try {
    if (pdf.numPages > MAX_PAGES) throw new PdfReadError("E-03");
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if ("str" in item) {
          text += item.str;
          if (item.hasEOL) text += "\n";
        }
      }
      pages.push(text.normalize("NFC"));
    }
    const totalChars = pages.reduce((sum, p) => sum + p.replace(/\s/g, "").length, 0);
    if (totalChars / pdf.numPages < MIN_AVG_CHARS) throw new PdfReadError("E-05");
    return pages;
  } finally {
    void task.destroy();
  }
}
