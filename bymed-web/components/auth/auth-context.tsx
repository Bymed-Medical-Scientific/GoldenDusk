"use client";

import type { AuthUserDto } from "@/types/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: AuthUserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_REFRESH_MS = 50 * 60 * 1000;

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AuthUserDto | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      await refreshSession();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshSession();
    }, SESSION_REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshSession]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await readErrorMessage(res));
    const data = (await res.json()) as { user: AuthUserDto };
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          registrationChannel: "Storefront",
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = (await res.json()) as {
        user: AuthUserDto;
        requiresEmailVerification?: boolean;
        pendingAdminApproval?: boolean;
      };
      if (data.pendingAdminApproval) {
        throw new Error(
          "Your account was created but is not active yet. You can sign in after an administrator approves your access.",
        );
      }
      if (data.requiresEmailVerification) {
        throw Object.assign(new Error("EMAIL_VERIFICATION_REQUIRED"), {
          code: "EMAIL_VERIFICATION_REQUIRED",
        });
      }

      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      /* still clear client session */
    }
    await new Promise((r) => setTimeout(r, 150));
    await refreshSession();
    router.replace("/");
    router.refresh();
  }, [refreshSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user != null,
      refreshSession,
      login,
      register,
      logout,
    }),
    [user, isLoading, refreshSession, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
