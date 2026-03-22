import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-brand text-brand-foreground shadow-[0_4px_0_0_#000000]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xl font-semibold tracking-tight">ByMed</p>
            <p className="text-sm text-white/90">Medical &amp; Scientific</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-white/90 hover:underline"
            >
              Sign in
            </Link>
            <Link
              href="/account"
              className="text-sm font-medium text-white/90 hover:underline"
            >
              Account
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Medical and scientific equipment
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Storefront foundation with light and dark themes aligned to the ByMed
          brand palette.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] transition-colors hover:bg-brand-hover"
          >
            Primary action
          </button>
          <button
            type="button"
            className="rounded-lg border border-border bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Secondary
          </button>
        </div>
      </main>
    </div>
  );
}
