export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://127.0.0.1:4000/api";

type AccessTokenRefresher = () => Promise<string | null>;
let accessTokenRefresher: AccessTokenRefresher | null = null;

export function setApiAccessTokenRefresher(refresher: AccessTokenRefresher | null) {
  accessTokenRefresher = refresher;
}

export async function refreshApiAccessToken() {
  return accessTokenRefresher?.() ?? null;
}

/** Resolve API-owned files (for example `/uploads/...`) against the API host. */
export function resolveApiAssetUrl(value: string): string {
  if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return value;

  try {
    return new URL(value, API_BASE_URL).toString();
  } catch {
    return value;
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const request = (accessToken?: string | null) => fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let response = await request(options.token);
  if (response.status === 401 && options.token && accessTokenRefresher) {
    const refreshedToken = await refreshApiAccessToken();
    if (refreshedToken) response = await request(refreshedToken);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  return response.json() as Promise<T>;
}
