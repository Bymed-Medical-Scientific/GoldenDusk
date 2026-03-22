"use client";

import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** Where to send anonymous users (default `/login`). */
  loginPath?: string;
};

export function ProtectedRoute({
  children,
  loginPath = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || user) return;
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/account";
    const q = new URLSearchParams({ from });
    router.replace(`${loginPath}?${q.toString()}`);
  }, [user, isLoading, router, loginPath]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
