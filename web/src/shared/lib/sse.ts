export interface SseEvent {
  event: string;
  data: string;
}

/** Phân tích một khối sự kiện SSE (các dòng giữa hai dòng trống) */
export function parseSseBlock(block: string): SseEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (data.length === 0) return null;
  return { event, data: data.join("\n") };
}

/**
 * Đọc luồng SSE từ một Response của fetch.
 * Dùng thay EventSource vì EventSource không hỗ trợ POST (plan mục 7.2).
 */
export async function* readSse(response: Response): AsyncGenerator<SseEvent> {
  if (!response.body) return;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const separator = /\r?\n\r?\n/;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let match = separator.exec(buffer);
      while (match) {
        const block = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const parsed = parseSseBlock(block);
        if (parsed) yield parsed;
        match = separator.exec(buffer);
      }
    }
    const rest = parseSseBlock(buffer);
    if (rest) yield rest;
  } finally {
    reader.releaseLock();
  }
}

export function encodeSse(event: string, data: unknown): string {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${event}\n${payload
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n")}\n\n`;
}
