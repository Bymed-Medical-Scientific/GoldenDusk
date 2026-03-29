"use client";

import type { CtaLink, HomeHeroSlide } from "@/lib/content/marketing-pages";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const slideShell =
  "relative min-h-[min(100svh,720px)] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br shadow-premium-lg sm:min-h-[560px] lg:min-h-[520px]";

const gradients = [
  "from-[#0000a8] via-[#0000cc] to-[#0d4f8c] dark:from-[#0a0a2e] dark:via-[#0000aa] dark:to-[#0d3d5c]",
  "from-[#0c4a6e] via-[#0000cc] to-[#134e4a] dark:from-[#0c2e44] dark:via-[#1e1e8a] dark:to-[#134e4a]",
  "from-[#115e59] via-[#1e3a8a] to-[#0000cc] dark:from-[#0f3d3a] dark:via-[#1e2a6b] dark:to-[#2222aa]",
];

type HomeHeroCarouselProps = {
  slides: HomeHeroSlide[];
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
};

export function HomeHeroCarousel({
  slides,
  primaryCta,
  secondaryCta,
}: HomeHeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  const onSelect = useCallback((carousel: CarouselApi | undefined) => {
    if (!carousel) return;
    setIndex(carousel.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const plugin = Autoplay({ delay: 6500, stopOnInteraction: true });
  const active = slides[index] ?? slides[0];

  return (
    <div className="relative px-4 pb-8 pt-6 sm:pb-12 sm:pt-8 lg:px-6">
      <div className="relative mx-auto max-w-7xl">
        <Carousel
          className="w-full"
          opts={{ align: "start", loop: true }}
          plugins={[plugin]}
          setApi={setApi}
        >
          <CarouselContent className="-ml-0">
            {slides.map((_, i) => (
              <CarouselItem key={i} className="pl-0">
                <div
                  className={cn(
                    slideShell,
                    gradients[i % gradients.length],
                  )}
                  aria-hidden={i !== index}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    aria-hidden
                  >
                    <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-teal-muted/30 blur-3xl" />
                    <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute right-1/4 top-10 h-48 w-48 animate-float rounded-full border border-white/20 bg-white/5 backdrop-blur-sm" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 flex flex-col justify-end px-6 pb-12 pt-24 sm:px-10 sm:pb-14 sm:pt-28 lg:px-14 lg:pb-16">
          <div className="pointer-events-auto mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl text-white lg:max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
                    {active.tag}
                  </p>
                  <h1 className="mt-4 text-balance text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
                    {active.title}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {active.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.35 }}
              >
                <Link
                  href={primaryCta.href}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-[#0000cc] shadow-premium-sm transition-transform hover:scale-[1.02] hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                >
                  {primaryCta.label}
                </Link>
                <Link
                  href={secondaryCta.href}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-transform hover:scale-[1.01] hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                >
                  {secondaryCta.label}
                </Link>
              </motion.div>
            </div>

            <div
              className="flex items-center gap-2 lg:flex-col lg:items-end"
              role="tablist"
              aria-label="Hero slides"
            >
              {slides.map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  role="tab"
                  aria-selected={dot === index}
                  aria-label={`Slide ${dot + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    dot === index
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60",
                  )}
                  onClick={() => api?.scrollTo(dot)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
