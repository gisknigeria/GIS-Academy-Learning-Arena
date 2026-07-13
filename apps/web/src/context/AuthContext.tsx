import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "../lib/api";
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
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

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
        }
      } catch (err) {
        // Only clear the session on a 401 (invalid/expired token).
        // Network errors or 5xx should not log the user out — the token
        // may still be valid and the API may just be temporarily unavailable.
        const isAuthError =
          err instanceof Error &&
          (err.message.includes('"statusCode":401') ||
            err.message.includes('"statusCode":403') ||
            err.message.toLowerCase().includes("unauthorized") ||
            err.message.toLowerCase().includes("expired"));

        if (isAuthError) {
          localStorage.removeItem(TOKEN_KEY);
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        } else if (isMounted) {
          // Keep the token in state — user stays "authenticated" with
          // whatever was last known, so they don't get bounced to /login
          // just because the API had a hiccup on startup.
          setUser(null);
        }
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
  }, [token]);

  async function refreshUser() {
    if (!token) {
      return;
    }

    const currentUser = await apiRequest<AuthUser>("/auth/me", { token });
    setUser(currentUser);
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
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      async register(payload) {
        const response = await apiRequest<AuthResponse>("/auth/register", {
          method: "POST",
          body: payload,
        });
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
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
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      refreshUser,
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [isLoading, token, user],
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
