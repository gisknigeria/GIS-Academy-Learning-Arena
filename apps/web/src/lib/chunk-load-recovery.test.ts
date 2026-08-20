import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./chunk-load-recovery";

describe("chunk load recovery", () => {
  it.each([
    "Failed to fetch dynamically imported module: /assets/Dashboard-old.js",
    "Failed to load module script: the server responded with text/html",
    "ChunkLoadError: Loading chunk 42 failed",
  ])("recognizes stale deployment errors: %s", (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it("does not treat ordinary application errors as stale chunks", () => {
    expect(isChunkLoadError(new Error("Request failed with status 401"))).toBe(false);
  });
});
