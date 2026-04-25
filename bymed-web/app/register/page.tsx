"use client";

import { useAuth } from "@/components/auth/auth-context";
import {
  getPasswordStrength,
  validateEmail,
  validatePassword,
} from "@/lib/auth/credentials-validation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  return null;
}

function RegisterPageContent() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = searchParams.get("from") || "/account/orders";
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(from);
    }
  }, [isLoading, isAuthenticated, from, router]);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError) nextErrors.name = nameError;
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setPending(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace(from);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "EMAIL_VERIFICATION_REQUIRED"
      ) {
        setSuccessMessage(
          "Your account was created. Check your email and click the verification link before signing in.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Registration failed.");
      }
    } finally {
      setPending(false);
    }
  }

  const strengthWidth = `${(strength.score / 4) * 100}%`;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Register to track your orders and save your details.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.email}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.password}</span>
          ) : null}

          <div className="mt-1">
            <div className="h-1.5 w-full rounded bg-muted">
              <div
                className="h-1.5 rounded bg-brand transition-all"
                style={{ width: strengthWidth }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Password strength: <span className="font-medium">{strength.label}</span>
            </p>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {errors.confirmPassword}
            </span>
          ) : null}
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400" role="status">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
