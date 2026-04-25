"use client";

import { useAuth } from "@/components/auth/auth-context";
import {
  validateEmail,
  validatePassword,
} from "@/lib/auth/credentials-validation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = searchParams.get("from") || "/products";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(from);
    }
  }, [isLoading, isAuthenticated, from, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nextErrors: { email?: string; password?: string } = {};
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPending(true);
    try {
      await login(email.trim(), password);
      router.replace(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use your Bymed account credentials.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.password}
            </span>
          ) : null}
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/reset-password" className="text-brand hover:underline">
          Forgot password?
        </Link>
        <span className="mx-2 text-muted-foreground">|</span>
        <Link href="/register" className="text-brand hover:underline">
          Create an account
        </Link>
        <span className="mx-2 text-muted-foreground">|</span>
        <Link href="/" className="text-brand hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
