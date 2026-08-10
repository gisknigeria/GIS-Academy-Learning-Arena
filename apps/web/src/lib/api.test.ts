import { describe, expect, it } from "vitest";
import { resolveApiAssetUrl } from "./api";

describe("resolveApiAssetUrl", () => {
  it("resolves local uploads against the API origin", () => {
    expect(resolveApiAssetUrl("/uploads/lessons/example.png"))
      .toBe("http://127.0.0.1:4000/uploads/lessons/example.png");
  });

  it("preserves remote and embedded asset URLs", () => {
    expect(resolveApiAssetUrl("https://cdn.example.com/file.pdf"))
      .toBe("https://cdn.example.com/file.pdf");
    expect(resolveApiAssetUrl("data:image/png;base64,abc"))
      .toBe("data:image/png;base64,abc");
  });
});
