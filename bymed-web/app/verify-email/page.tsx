"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type VerifyState = "verifying" | "success" | "error";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyState>("verifying");
  const [message, setMessage] = useState("Verifying your email. Please wait...");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Verification link is missing required details.");
      return;
    }

    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/auth/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
          { method: "GET", signal: controller.signal, cache: "no-store" },
        );

        if (res.status === 204) {
          setStatus("success");
          setMessage("Email verified successfully. You can now sign in.");
          return;
        }

        let errorText = "Verification failed. Please request a new verification email.";
        try {
          const data = (await res.json()) as { error?: string };
          if (typeof data.error === "string" && data.error.trim()) {
            errorText = data.error;
          }
        } catch {
          // Ignore parsing fallback
        }

        setStatus("error");
        setMessage(errorText);
      } catch {
        setStatus("error");
        setMessage("Could not verify your email right now. Please try again.");
      }
    })();

    return () => controller.abort();
  }, [email, token]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Email verification</h1>
      <p
        className={`mt-4 text-sm ${
          status === "success"
            ? "text-emerald-700 dark:text-emerald-300"
            : status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
        }`}
        role={status === "error" ? "alert" : "status"}
      >
        {message}
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
