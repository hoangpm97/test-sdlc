import { describe, expect, it } from "vitest";
import { encodeSse, parseSseBlock, readSse } from "./sse";

function responseFrom(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("parseSseBlock", () => {
  it("đọc event và data", () => {
    expect(parseSseBlock('event: token\ndata: {"text":"Xin"}')).toEqual({
      event: "token",
      data: '{"text":"Xin"}',
    });
  });

  it("gộp nhiều dòng data và bỏ qua comment", () => {
    expect(parseSseBlock(": ping\ndata: a\ndata: b")).toEqual({ event: "message", data: "a\nb" });
  });

  it("trả về null khi không có data", () => {
    expect(parseSseBlock(": heartbeat")).toBeNull();
  });
});

describe("readSse", () => {
  it("ghép đúng sự kiện bị cắt giữa các chunk mạng", async () => {
    const events = [];
    const raw = encodeSse("token", { text: "Đối tác" }) + encodeSse("done", { messageId: "m1" });
    const response = responseFrom([raw.slice(0, 7), raw.slice(7, 30), raw.slice(30)]);
    for await (const event of readSse(response)) events.push(event);
    expect(events.map((e) => e.event)).toEqual(["token", "done"]);
    expect(JSON.parse(events[0]?.data ?? "{}")).toEqual({ text: "Đối tác" });
  });
});
