"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type AboutStat = {
  label: string;
  value: number;
  suffix?: string;
  compact?: boolean;
};

function formatStatValue({ suffix, compact }: AboutStat, count: number): string {
  if (compact) {
    const compactValue =
      count >= 1000
        ? `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`
        : `${count}`;
    return `${compactValue}${suffix ?? ""}`;
  }
  return `${Math.round(count)}${suffix ?? ""}`;
}

function AnimatedStat({ stat }: { stat: AboutStat }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setHasAnimated(true);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const durationMs = 1400;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(stat.value * eased);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [hasAnimated, stat.value]);

  const formattedValue = useMemo(
    () => formatStatValue(stat, displayValue),
    [displayValue, stat],
  );

  return (
    <div ref={ref} className="text-center">
      <p className="font-heading text-2xl font-bold tracking-tight sm:text-4xl">
        {formattedValue}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-brand-foreground/85 sm:text-xs sm:tracking-[0.14em]">
        {stat.label}
      </p>
    </div>
  );
}

export function AboutStatsStrip({ stats }: { stats: AboutStat[] }) {
  return (
    <div className="relative mx-auto grid max-w-7xl grid-cols-3 gap-4 px-4 sm:gap-6 sm:px-6">
      {stats.map((stat) => (
        <AnimatedStat key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
