"use client";

import { useAuth } from "@/components/auth/auth-context";
import Link from "next/link";

export default function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Your account</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user?.email}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{user?.name}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Sign out
        </button>
        <Link
          href="/"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
