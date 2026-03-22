"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
  { value: "system" as const, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-[11.5rem] rounded-md bg-black/15"
        aria-hidden
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex gap-0.5 rounded-md bg-black/20 p-1"
    >
      {options.map(({ value, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              active
                ? "bg-white text-brand-ink shadow-sm"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
