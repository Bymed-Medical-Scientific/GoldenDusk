"use client";

import type { HomeMarketingContent, HomeOfferingPartner } from "@/lib/content/marketing-pages";
import { MotionFadeUp, MotionSection } from "./motion-section";
import {
  Bed,
  Building2,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Package,
  Scale,
  Scissors,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

function offeringIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("technical teaching")) return GraduationCap;
  if (t.includes("theatre")) return Scissors;
  if (t.includes("medical teaching")) return HeartPulse;
  if (t.includes("scale")) return Scale;
  if (t.includes("hospital")) return Bed;
  if (t.includes("point of care")) return Stethoscope;
  if (t.includes("instrument")) return Wrench;
  if (t.includes("school") || t.includes("laboratory equipment"))
    return FlaskConical;
  if (t.includes("consumable")) return Package;
  return Building2;
}

function PartnerLinks({ partners }: { partners: HomeOfferingPartner[] }) {
  if (partners.length === 0) return null;
  const label = partners.length === 1 ? "Featured brand" : "Brands";
  return (
    <p className="mt-4 text-sm text-muted-foreground">
      <span className="font-medium text-foreground/90">{label}: </span>
      {partners.map((p, i) => (
        <span key={p.href}>
          {i > 0 && <span className="text-muted-foreground/50"> · </span>}
          <Link
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {p.label}
            <span className="sr-only"> (opens in new tab)</span>
          </Link>
        </span>
      ))}
    </p>
  );
}

const AUTO_ADVANCE_MS = 6500;
const TILT_MAX = 10;

function OfferingSpotlightCard({
  title,
  blurb,
  partners,
  reduceMotion,
}: {
  title: string;
  blurb: string;
  partners: HomeOfferingPartner[];
  reduceMotion: boolean | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -TILT_MAX, y: px * TILT_MAX });
  }, [reduceMotion]);

  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const Icon = offeringIcon(title);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto max-w-lg [perspective:1200px] lg:mx-0"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="rounded-2xl border border-border/80 bg-card bg-gradient-to-br from-card to-muted/40 p-8 shadow-lg ring-1 ring-border/60 backdrop-blur-sm transition-transform duration-100 ease-out will-change-transform dark:shadow-black/40 dark:ring-border"
        style={{
          transform: reduceMotion
            ? undefined
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/35"
          style={{ transform: "translateZ(24px)" }}
        >
          <Icon className="size-7" aria-hidden />
        </div>
        <h3
          className="font-heading mt-6 text-2xl font-bold tracking-tight text-card-foreground"
          style={{ transform: "translateZ(12px)" }}
        >
          {title}
        </h3>
        <p
          className="mt-3 text-base leading-relaxed text-muted-foreground"
          style={{ transform: "translateZ(8px)" }}
        >
          {blurb}
        </p>
        <div style={{ transform: "translateZ(16px)" }}>
          <PartnerLinks partners={partners} />
        </div>
      </div>
    </div>
  );
}

export function HomeWhatWeOfferSection({ data }: { data: HomeMarketingContent }) {
  const { whatWeOfferHeading, whatWeOfferIntro, offerings } = data;
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pauseRotate, setPauseRotate] = useState(false);

  const n = offerings.length;
  const active = offerings[activeIndex] ?? offerings[0];
  const partners = active?.partners ?? [];

  useEffect(() => {
    if (reduceMotion || pauseRotate || n < 2) return;
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % n);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(t);
  }, [reduceMotion, pauseRotate, n]);

  const go = (i: number) => setActiveIndex(((i % n) + n) % n);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = useCallback((i: number) => {
    const idx = ((i % n) + n) % n;
    requestAnimationFrame(() => tabRefs.current[idx]?.focus());
  }, [n]);

  const onTabListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (n < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (activeIndex + 1) % n;
      go(next);
      focusTab(next);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (activeIndex - 1 + n) % n;
      go(prev);
      focusTab(prev);
    }
    if (e.key === "Home") {
      e.preventDefault();
      go(0);
      focusTab(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      go(n - 1);
      focusTab(n - 1);
    }
  };

  return (
    <MotionSection
      className="bg-background py-16 text-foreground sm:py-20"
      aria-labelledby="what-we-offer-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-16">
          <MotionFadeUp>
            <p className="font-script text-2xl text-primary sm:text-3xl">
              Built for precision
            </p>
            <h2
              id="what-we-offer-heading"
              className="font-heading mt-2 text-3xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl"
            >
              {whatWeOfferHeading}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {whatWeOfferIntro}
            </p>
          </MotionFadeUp>

          <MotionFadeUp
            className="flex flex-col gap-8"
            onMouseEnter={() => setPauseRotate(true)}
            onMouseLeave={() => setPauseRotate(false)}
            onFocusCapture={() => setPauseRotate(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setPauseRotate(false);
              }
            }}
          >
            <div
              className="flex flex-wrap gap-2 sm:gap-2.5"
              role="tablist"
              aria-label="Select a category. Use arrow keys to move between categories."
              onKeyDown={onTabListKeyDown}
            >
              {offerings.map((o, i) => {
                const Icon = offeringIcon(o.title);
                const selected = i === activeIndex;
                return (
                  <button
                    key={o.title}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => go(i)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-left text-sm font-medium transition-colors",
                      selected
                        ? "border-primary/50 bg-primary/15 text-foreground shadow-premium-sm ring-1 ring-primary/25 dark:ring-primary/35"
                        : "border-border bg-muted/60 text-foreground/85 hover:border-border hover:bg-muted dark:bg-muted/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        selected ? "text-primary" : "text-primary/70",
                      )}
                      aria-hidden
                    />
                    <span className="max-w-[11rem] truncate sm:max-w-none">
                      {o.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id={`${baseId}-panel`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${activeIndex}`}
              className="min-h-[min(22rem,70vw)] lg:min-h-[20rem]"
            >
              <AnimatePresence mode="wait">
                {active ? (
                  <motion.div
                    key={active.title}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 16, rotateX: -6, filter: "blur(6px)" }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      filter: "blur(0px)",
                    }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, y: -12, rotateX: 6, filter: "blur(4px)" }
                    }
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <OfferingSpotlightCard
                      title={active.title}
                      blurb={active.blurb}
                      partners={partners}
                      reduceMotion={reduceMotion}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {!reduceMotion && n > 1 ? (
              <div
                className="flex items-center justify-center gap-1.5 sm:justify-start"
                aria-hidden
              >
                {offerings.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/55",
                    )}
                    tabIndex={-1}
                    onClick={() => go(i)}
                  />
                ))}
              </div>
            ) : null}
          </MotionFadeUp>
        </div>
      </div>
    </MotionSection>
  );
}
