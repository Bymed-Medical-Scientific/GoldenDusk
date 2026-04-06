"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";
import { MotionFadeUp, MotionSection } from "./motion-section";

/** Partner / supplier brands: HTTPS sites only; text tiles avoid third-party image failures. */
export const HOME_BRAND_SLIDER_ITEMS = [
  {
    name: "Edibon",
    href: "https://www.edibon.com/en/",
  },
  {
    name: "Tekno",
    href: "https://www.tekno-medical.com/en/",
  },
  {
    name: "3B Scientific",
    href: "https://www.3bscientific.com/",
  },
  {
    name: "Adam Equipment",
    href: "https://www.adamequipment.com/",
  },
  {
    name: "Narang",
    href: "https://www.narang.com/",
  },
  {
    name: "Roche",
    href: "https://www.roche.com/",
  },
  {
    name: "Philips",
    href: "https://www.philips.com/",
  },
  {
    name: "GE Healthcare",
    href: "https://www.gehealthcare.com/",
  },
  {
    name: "Terumo",
    href: "https://www.terumo.com/",
  },
  {
    name: "Olympus",
    href: "https://www.olympus-lifescience.com/",
  },
] as const;

function BrandSlide({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
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
      <span className="font-heading text-center text-lg font-semibold tracking-tight text-foreground/80">
        {name}
      </span>
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
