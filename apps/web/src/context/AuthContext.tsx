import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiRequest, setApiAccessTokenRefresher } from "../lib/api";
import { profileApi } from "../lib/profile-api";
import { loadKnowledgeHubPreferences, mergeKnowledgeHubPreferences, saveKnowledgeHubPreferences } from "../data/knowledgeHub";
import type { AuthResponse, AuthUser, UserRole } from "../types/auth";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  fullName: string;
  phone?: string;
  role?: UserRole;
  ageBand?: string;
  organisation?: string;
  trainingCategory?: string;
  learningMode?: string;
  learningGoal?: string;
  fanCategory?: string;
  favorite?: string;
  learningStyle?: string;
  competitionType?: string;
  courseInterest?: string;
  notificationPreference?: string;
  languagePreference?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  redeemPromo: (code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "gis_arena_token";
const REFRESH_TOKEN_KEY = "gis_arena_refresh_token";
const USER_KEY = "gis_arena_user";
const REFRESH_BEFORE_EXPIRY_MS = 30 * 60 * 1000;
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as AuthUser | null;
  } catch {
    return null;
  }
}

function isAuthenticationError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('"statuscode":401') || message.includes("unauthorized") || message.includes("expired token");
}

export function getJwtExpiryMs(token: string): number | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const storeSession = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    if (response.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (credential?: string | null) => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const refreshToken = credential ?? localStorage.getItem(REFRESH_TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    if (!refreshToken) return false;

    const request = (async () => {
      try {
        const response = await apiRequest<AuthResponse>("/auth/refresh", {
          method: "POST",
          body: { refreshToken },
        });
        storeSession(response);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = request;
    return request;
  }, [storeSession]);

  useEffect(() => {
    setApiAccessTokenRefresher(async () => await refreshSession() ? localStorage.getItem(TOKEN_KEY) : null);
    return () => setApiAccessTokenRefresher(null);
  }, [refreshSession]);

  async function syncPersonalization(accessToken: string) {
    try {
      const fullUser = await profileApi.getMe(accessToken);
      const preferences = mergeKnowledgeHubPreferences(loadKnowledgeHubPreferences(), fullUser.profile);
      saveKnowledgeHubPreferences(preferences);
    } catch {
      // Authentication should still succeed if profile personalization is temporarily unavailable.
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest<AuthUser>("/auth/me", { token });
        if (isMounted) {
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          void syncPersonalization(token);
        }
        // Upgrade sessions created before refresh tokens were introduced.
        if (!localStorage.getItem(REFRESH_TOKEN_KEY)) await refreshSession(token);
      } catch (err) {
        // Only clear the session on a 401 (invalid/expired token).
        // Network errors or 5xx should not log the user out — the token
        // may still be valid and the API may just be temporarily unavailable.
        if (isAuthenticationError(err)) {
          const refreshed = await refreshSession();
          if (!refreshed && isMounted) clearSession();
        }
        // For network and server errors, retain both the token and the last
        // known user so role-protected editing pages do not redirect.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [clearSession, refreshSession, token]);

  useEffect(() => {
    if (!token) return;
    const maintainSession = () => {
      const expiresAt = getJwtExpiryMs(localStorage.getItem(TOKEN_KEY) ?? token);
      const needsRefreshToken = !localStorage.getItem(REFRESH_TOKEN_KEY);
      if (needsRefreshToken || expiresAt === null || expiresAt - Date.now() <= REFRESH_BEFORE_EXPIRY_MS) {
        void refreshSession();
      }
    };
    const handleVisibility = () => { if (document.visibilityState === "visible") maintainSession(); };
    maintainSession();
    const interval = window.setInterval(maintainSession, 5 * 60 * 1000);
    window.addEventListener("focus", maintainSession);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", maintainSession);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSession, token]);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;
      setToken(event.newValue);
      setUser(event.newValue ? readStoredUser() : null);
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  async function refreshUser() {
    if (!token) {
      return;
    }

    try {
      const currentUser = await apiRequest<AuthUser>("/auth/me", { token });
      setUser(currentUser);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      await syncPersonalization(token);
    } catch (error) {
      if (!isAuthenticationError(error) || !await refreshSession()) throw error;
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      async login(payload) {
        const response = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: payload,
        });
        storeSession(response);
        await syncPersonalization(response.accessToken);
      },
      async register(payload) {
        const response = await apiRequest<AuthResponse>("/auth/register", {
          method: "POST",
          body: payload,
        });
        storeSession(response);
        await syncPersonalization(response.accessToken);
      },
      async redeemPromo(code) {
        if (!token) {
          throw new Error("You must be logged in to redeem a promo code.");
        }

        const response = await apiRequest<AuthResponse & { message: string }>("/auth/redeem-promo", {
          method: "POST",
          token,
          body: { code },
        });
        storeSession(response);
      },
      refreshUser,
      logout() {
        clearSession();
      },
    }),
    [clearSession, isLoading, storeSession, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
