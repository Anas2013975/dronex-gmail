import { describe, expect, it } from "vitest";
import { isSameOrigin } from "../src/lib/origin";

describe("isSameOrigin (CSRF)", () => {
  it("accepts matching host", () => expect(isSameOrigin("https://a.example", "a.example")).toBe(true));
  it("accepts configured dashboard origin", () => expect(isSameOrigin("https://a.example", "internal", "https://a.example/x")).toBe(true));
  it("rejects missing, malformed and foreign origins", () => {
    expect(isSameOrigin(null, "a.example")).toBe(false);
    expect(isSameOrigin("not a url", "a.example")).toBe(false);
    expect(isSameOrigin("https://evil.example", "a.example", "https://a.example")).toBe(false);
  });
});
