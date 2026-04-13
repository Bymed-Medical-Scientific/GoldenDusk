"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useMemo } from "react";
import { MotionFadeUp, MotionSection } from "./motion-section";

/** Partner / supplier brands with local logo assets and HTTPS links. */
export const HOME_BRAND_SLIDER_ITEMS = [
  {
    name: "3B Scientific",
    href: "https://www.3bscientific.com/",
    logoSrc: "/assets/brands/3BLogo-CJedIKtz-300x51.webp",
  },
  {
    name: "Protec",
    href: "https://www.protec.com/",
    logoSrc: "/assets/brands/protecLogo-CENtqv4W-300x240.webp",
  },
  {
    name: "MRC",
    href: "https://www.mrclab.com/",
    logoSrc: "/assets/brands/MRC-D7Wnwzwr.webp",
  },
  {
    name: "Adam Equipment",
    href: "https://www.adamequipment.com/",
    logoSrc: "/assets/brands/download-300x48.webp",
  },
  {
    name: "Tekno Medical",
    href: "https://www.tekno-medical.com/en/",
    logoSrc: "/assets/brands/tk_logo415_02-300x181.webp",
  },
  {
    name: "Narang",
    href: "https://www.netbrand.co.za/",
    logoSrc: "/assets/brands/net-logo-DrM9r0wY-300x129.webp",
  },
  {
    name: "Edibon",
    href: "https://www.edibon.com/en/",
    logoSrc: "/assets/brands/edibon.png",
  },
  {
    name: "Stahlmann Pro",
    href: "https://stahlmann.co.za/",
    logoSrc: "/assets/brands/StahlmannPro-DbcylnKC.webp",
  },
  {
    name: "CSE Medical",
    href: "https://csemedical.co.za/",
    logoSrc: "/assets/brands/logo-medical-CSE-Final-300x162.webp",
  },
] as const;

function BrandSlide({
  name,
  href,
  logoSrc,
}: {
  name: string;
  href: string;
  logoSrc: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex h-24 min-h-24 w-full items-center justify-center rounded-xl bg-background px-4 py-3 ring-1 ring-border/60 transition-[opacity,box-shadow] hover:bg-muted/50 hover:ring-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      aria-label={`${name} website (opens in new tab)`}
    >
      <div className="relative h-14 w-full max-w-[220px]">
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          fill
          className="object-contain"
          sizes="220px"
        />
      </div>
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
                      logoSrc={brand.logoSrc}
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
