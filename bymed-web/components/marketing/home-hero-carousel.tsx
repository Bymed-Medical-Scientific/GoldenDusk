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
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/** Full small-viewport height so the first screen hides the following section (was capped at ~88–96svh on larger breakpoints). */
const heroMinHeightClass = "min-h-[100svh]";

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

  const plugin = Autoplay({ delay: 7000, stopOnInteraction: true });
  const active = slides[index] ?? slides[0];

  return (
    <section
      className="relative w-full overflow-hidden bg-[#0a0a0c]"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
    >
      <div className={cn("relative w-full", heroMinHeightClass)}>
        <Carousel
          className="absolute inset-0 h-full w-full"
          opts={{ align: "start", loop: true }}
          plugins={[plugin]}
          setApi={setApi}
        >
          <CarouselContent className="-ml-0 h-full">
            {slides.map((slide, i) => (
              <CarouselItem key={i} className={cn("h-full pl-0", heroMinHeightClass)}>
                <div className="relative h-full min-h-[inherit] w-full">
                  {slide.imageSrc ? (
                    <Image
                      src={slide.imageSrc}
                      alt=""
                      fill
                      priority={i === 0}
                      className="object-cover object-center"
                      sizes="100vw"
                      quality={
                        slide.imageSrc.startsWith("/") ? 95 : 88
                      }
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35"
                    aria-hidden
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Top band: keeps transparent header + light overlay nav readable on bright slide crops */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[11] h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent sm:h-40"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col pt-[4.5rem] sm:pt-20">
          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <div className="pointer-events-auto mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl text-left text-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p
                      className="font-script text-2xl leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl md:text-[2rem]"
                    >
                      {active.tag}
                    </p>
                    <h1 className="font-heading mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-white sm:mt-4 sm:text-4xl sm:leading-[1.06] lg:text-5xl xl:text-[3.35rem]">
                      {active.title}
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/88 sm:text-lg">
                      {active.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  className="mt-8 flex flex-wrap gap-3"
                  initial={false}
                >
                  <Link
                    href={primaryCta.href}
                    className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-[1.02] hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                  >
                    {primaryCta.label}
                  </Link>
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex h-12 min-h-12 items-center justify-center rounded-full border-0 bg-white/10 px-8 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgb(0_0_0_/_0.45)] backdrop-blur-sm transition-[transform,box-shadow] hover:bg-white/18 hover:shadow-[0_12px_32px_-10px_rgb(0_0_0_/_0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                  >
                    {secondaryCta.label}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-14 lg:px-8">
            <div className="flex gap-2" role="tablist" aria-label="Hero slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-10 bg-white"
                      : "w-10 bg-white/35 hover:bg-white/55",
                  )}
                  onClick={() => api?.scrollTo(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
