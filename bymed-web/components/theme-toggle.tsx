"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

type ThemeToggleProps = {
  /** When true, styles for placement on the brand (blue) header bar. */
  variant?: "header" | "default";
  className?: string;
};

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-10 w-10 shrink-0 rounded-md bg-black/15 ${className}`}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  const buttonClass =
    variant === "header"
      ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${buttonClass} ${className}`}
      aria-label={nextLabel}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
