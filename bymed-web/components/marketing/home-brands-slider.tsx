"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useMemo, useState } from "react";
import { MotionFadeUp, MotionSection } from "./motion-section";

/** Partner / supplier brands: HTTPS sites only; logos loaded via Clearbit with text fallback. */
export const HOME_BRAND_SLIDER_ITEMS = [
  {
    name: "Edibon",
    href: "https://www.edibon.com/en/",
    logoDomain: "edibon.com",
  },
  {
    name: "Tekno",
    href: "https://www.tekno-medical.com/en/",
    logoDomain: "tekno-medical.com",
  },
  {
    name: "3B Scientific",
    href: "https://www.3bscientific.com/",
    logoDomain: "3bscientific.com",
  },
  {
    name: "Adam Equipment",
    href: "https://www.adamequipment.com/",
    logoDomain: "adamequipment.com",
  },
  {
    name: "Narang",
    href: "https://www.narang.com/",
    logoDomain: "narang.com",
  },
  {
    name: "Roche",
    href: "https://www.roche.com/",
    logoDomain: "roche.com",
  },
  {
    name: "Philips",
    href: "https://www.philips.com/",
    logoDomain: "philips.com",
  },
  {
    name: "GE Healthcare",
    href: "https://www.gehealthcare.com/",
    logoDomain: "gehealthcare.com",
  },
  {
    name: "Terumo",
    href: "https://www.terumo.com/",
    logoDomain: "terumo.com",
  },
  {
    name: "Olympus",
    href: "https://www.olympus-lifescience.com/",
    logoDomain: "olympus-lifescience.com",
  },
] as const;

function clearbitLogoUrl(domain: string) {
  return `https://logo.clearbit.com/${domain}`;
}

function BrandSlide({
  name,
  href,
  logoDomain,
}: {
  name: string;
  href: string;
  logoDomain: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const src = clearbitLogoUrl(logoDomain);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex h-24 min-h-24 w-full items-center justify-center rounded-xl px-4 py-3 ring-1 ring-border/60 transition-[opacity,box-shadow] hover:bg-muted/50 hover:ring-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      aria-label={`${name} website (opens in new tab)`}
    >
      {logoFailed ? (
        <span className="font-heading text-center text-lg font-semibold tracking-tight text-foreground/80">
          {name}
        </span>
      ) : (
        <Image
          src={src}
          alt=""
          width={160}
          height={56}
          sizes="(max-width: 400px) 70vw, (max-width: 640px) 45vw, (max-width: 768px) 35vw, (max-width: 1024px) 28vw, 18vw"
          className="h-11 w-auto max-w-[9.5rem] object-contain opacity-85 grayscale transition-[filter,opacity] hover:opacity-100 dark:opacity-90 dark:hover:opacity-100 [.dark_&]:brightness-110 [.dark_&]:contrast-95"
          onError={() => setLogoFailed(true)}
        />
      )}
    </a>
  );
}

const AUTOPLAY_MS = 4000;

export function HomeBrandsSlider() {
  const plugin = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_MS,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    [],
  );

  return (
    <MotionSection
      className="bg-muted py-12 text-foreground sm:py-14"
      aria-labelledby="home-brands-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <MotionFadeUp className="font-script text-center text-2xl text-primary sm:text-3xl">
          Our partners
        </MotionFadeUp>
        <MotionFadeUp>
          <h2
            id="home-brands-heading"
            className="font-heading mt-2 text-center text-3xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl"
          >
            Brands
          </h2>
        </MotionFadeUp>
        <MotionFadeUp className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
          Manufacturers and partners we work with—tap a logo to visit their site.
        </MotionFadeUp>

        <MotionFadeUp className="relative mt-10">
          <Carousel
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[plugin]}
            aria-label="Brand logos"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {HOME_BRAND_SLIDER_ITEMS.map((brand) => (
                <CarouselItem
                  key={brand.name}
                  className="basis-[70%] pl-3 min-[400px]:basis-[45%] sm:basis-[35%] sm:pl-4 md:basis-[28%] lg:basis-[22%] xl:basis-[18%]"
                >
                  <MotionFadeUp>
                    <BrandSlide
                      name={brand.name}
                      href={brand.href}
                      logoDomain={brand.logoDomain}
                    />
                  </MotionFadeUp>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </MotionFadeUp>
      </div>
    </MotionSection>
  );
}
