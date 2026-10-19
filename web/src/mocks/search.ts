import type { Citation } from "@/shared/types";

/**
 * Bộ "truy xuất" giả lập cho chế độ demo: tìm theo từ khóa trên văn bản PDF thật.
 * Backend thật dùng hybrid search + LLM (SAD mục 4.2); module này chỉ mô phỏng
 * hình dạng dữ liệu để giao diện hoạt động trọn vẹn.
 */

export interface PageText {
  documentId: string;
  fileName: string;
  page: number;
  text: string;
}

export interface Chunk extends PageText {}

export interface Hit {
  chunk: Chunk;
  score: number;
}

const STOP_WORDS = new Set(
  (
    "là của và có không gì nào những các với cho được trong thì về này đó như thế bao nhiêu hãy tôi bạn " +
    "mình một hai khi nếu thể nên cần hỏi xem cái sao vậy đã đang sẽ bị từ đến theo trên dưới ra vào " +
    "ai đâu bằng hay hoặc mà rồi còn cũng lại chỉ rất nhất hơn tại do vì nhé ạ ơi " +
    "what is the a an of and to in for how which who when where why are was be does do with on about"
  ).split(" "),
);

export function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s*\n\s*/g, "\n")
    .split(/(?<=[.!?…;:])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0);
}

/** Chia văn bản từng trang thành các đoạn ~size ký tự, giữ số trang */
export function chunkPages(pages: PageText[], size = 500): Chunk[] {
  const chunks: Chunk[] = [];
  for (const page of pages) {
    let current = "";
    for (const sentence of splitSentences(page.text)) {
      if (current && current.length + sentence.length > size) {
        chunks.push({ ...page, text: current });
        current = "";
      }
      current = current ? `${current} ${sentence}` : sentence;
    }
    if (current) chunks.push({ ...page, text: current });
  }
  return chunks;
}

export function search(chunks: Chunk[], query: string, limit = 4): Hit[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];
  // Cần khớp ít nhất 60% từ khóa (và tối thiểu 2) để tránh khớp nhầm kiểu "thủ đô" ↔ "đối thủ"
  const minMatched = Math.max(Math.min(2, terms.length), Math.ceil(terms.length * 0.6));
  const phrase = terms.length > 1 ? normalize(query) : "";

  const hits: Hit[] = [];
  for (const chunk of chunks) {
    const tokens = tokenize(chunk.text);
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

    let score = 0;
    let matched = 0;
    for (const term of terms) {
      const c = counts.get(term) ?? 0;
      if (c > 0) {
        matched++;
        score += 1 + Math.log(c);
      }
    }
    if (matched < minMatched) continue;
    // Từ tiếng Việt thường gồm 2 âm tiết: thưởng điểm khi cặp từ liền kề của câu hỏi
    // cũng đứng liền nhau trong đoạn, và loại đoạn không có cặp nào (câu hỏi ≥ 3 từ khóa)
    const lower = normalize(chunk.text).replace(/[^\p{L}\p{N}]+/gu, " ");
    let pairHits = 0;
    for (let i = 0; i < terms.length - 1; i++) {
      if (lower.includes(`${terms[i]} ${terms[i + 1]}`)) pairHits++;
    }
    if (terms.length >= 3 && pairHits === 0) continue;
    score += pairHits * 1.5;
    if (phrase && lower.includes(phrase)) score += 3;
    hits.push({ chunk, score: score * (matched / terms.length) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function bestSentence(text: string, query: string, max = 240): string {
  const terms = tokenize(query);
  let best = "";
  let bestScore = -1;
  for (const sentence of splitSentences(text)) {
    const lower = normalize(sentence);
    const score = terms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return best.length > max ? `${best.slice(0, max - 1).trimEnd()}…` : best;
}

export interface ComposedAnswer {
  content: string;
  citations: Citation[];
  notFound: boolean;
}

export const NOT_FOUND_TEXT =
  "Mình không tìm thấy thông tin này trong các tài liệu đã tải lên. Bạn thử diễn đạt lại câu hỏi, dùng từ khóa cụ thể hơn, hoặc mở rộng phạm vi tài liệu nhé.";

export function composeAnswer(query: string, hits: Hit[]): ComposedAnswer {
  if (hits.length === 0) return { content: NOT_FOUND_TEXT, citations: [], notFound: true };

  const citations: Citation[] = hits.map((hit, i) => ({
    index: i + 1,
    documentId: hit.chunk.documentId,
    fileName: hit.chunk.fileName,
    page: hit.chunk.page,
    snippet: bestSentence(hit.chunk.text, query, 300),
  }));
  const docCount = new Set(citations.map((c) => c.documentId)).size;
  const lines = citations.map(
    (c) => `- **${c.fileName}**, trang ${c.page}: “${bestSentence(c.snippet, query)}” [${c.index}]`,
  );
  const intro =
    docCount > 1
      ? `Mình tìm thấy ${hits.length} đoạn liên quan trong ${docCount} tài liệu:`
      : `Mình tìm thấy ${hits.length} đoạn liên quan:`;

  return {
    content: `${intro}\n\n${lines.join("\n")}\n\nBạn có thể nhấp vào số trích dẫn để mở đúng trang trong tài liệu gốc.`,
    citations,
    notFound: false,
  };
}

export interface DocSummaryInput {
  documentId: string;
  fileName: string;
  summary: string;
}

export function composeSummaryAnswer(docs: DocSummaryInput[]): ComposedAnswer {
  const citations: Citation[] = docs.map((d, i) => ({
    index: i + 1,
    documentId: d.documentId,
    fileName: d.fileName,
    page: 1,
    snippet: d.summary.slice(0, 300),
  }));
  const body = docs.map((d, i) => `**${d.fileName}**\n\n${d.summary} [${i + 1}]`).join("\n\n");
  return { content: `Đây là tóm tắt nội dung chính:\n\n${body}`, citations, notFound: false };
}

/** Tóm tắt và ý chính dạng trích chọn (extractive) cho tài liệu */
export function summarize(pages: string[]): { summary: string; keyPoints: string[] } {
  const sentences = pages
    .flatMap((p) => splitSentences(p))
    .filter((s) => s.length >= 40 && s.length <= 320);
  const words: string[] = [];
  for (const s of sentences) {
    if (words.length >= 160) break;
    words.push(...s.split(" "));
  }
  const summary = words.slice(0, 180).join(" ");
  const keyPoints = [...sentences]
    .sort((a, b) => tokenize(b).length - tokenize(a).length)
    .slice(0, 5)
    .map((s) => (s.length > 160 ? `${s.slice(0, 159)}…` : s));
  return {
    summary: summary || "Tài liệu có ít nội dung văn bản để tóm tắt.",
    keyPoints,
  };
}
