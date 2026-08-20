import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, resolveApiAssetUrl, setApiAccessTokenRefresher } from "./api";

afterEach(() => {
  setApiAccessTokenRefresher(null);
  vi.restoreAllMocks();
});

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

describe("apiRequest session renewal", () => {
  it("refreshes and retries one request after an expired access token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response('{"statusCode":401}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json" } }));
    setApiAccessTokenRefresher(async () => "renewed-token");

    await expect(apiRequest<{ ok: boolean }>("/protected", { token: "expired-token" }))
      .resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({ authorization: "Bearer renewed-token" });
  });
});
