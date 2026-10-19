import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("giữ cả cỡ chữ tùy biến và màu chữ", () => {
    expect(cn("text-brand-fg", "text-body")).toBe("text-brand-fg text-body");
  });

  it("vẫn gộp đúng các class xung đột", () => {
    expect(cn("text-small", "text-title")).toBe("text-title");
    expect(cn("bg-brand", "bg-danger")).toBe("bg-danger");
  });
});
