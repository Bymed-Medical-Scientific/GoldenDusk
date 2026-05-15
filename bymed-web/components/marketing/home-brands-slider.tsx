"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { MotionFadeUp, MotionSection } from "./motion-section";

/** Partner / supplier brands with local logo assets and HTTPS links. */
export const HOME_BRAND_SLIDER_ITEMS = [
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
    name: "Edibon",
    href: "https://www.edibon.com/en/",
    logoSrc: "/assets/brands/edibon.png",
  },
  {
    name: "3B Scientific",
    href: "https://www.3bscientific.com/",
    logoSrc: "/assets/brands/3BLogo-CJedIKtz-300x51.webp",
  },
  {
    name: "CSE Medical",
    href: "https://www.medicalcse.com/mcse/web/indexenglish.html",
    logoSrc: "/assets/brands/logo-medical-CSE-Final-300x162.webp",
  },
  {
    name: "MRC",
    href: "https://www.mrclab.com/",
    logoSrc: "/assets/brands/MRC-D7Wnwzwr.webp",
  },
  {
    name: "Narang",
    href: "https://www.narang.com/",
    logoSrc: "/assets/brands/net-logo-DrM9r0wY-300x129.webp",
  },
  {
    name: "Stahlmann Pro",
    href: "https://stahlmannpro.com/medical/",
    logoSrc: "/assets/brands/StahlmannPro-DbcylnKC.webp",
  },
  {
    name: "Protec",
    href: "https://protec-med.com/en/",
    logoSrc: "/assets/brands/protecLogo-CENtqv4W-300x240.webp",
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
        "flex h-24 w-[200px] shrink-0 items-center justify-center rounded-xl bg-background px-4 py-3 ring-1 ring-border/60 transition-[opacity,box-shadow] hover:bg-muted/50 hover:ring-border sm:w-[220px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      aria-label={`${name} website (opens in new tab)`}
    >
      <div className="relative h-14 w-full max-w-[180px]">
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          fill
          className="object-contain"
          sizes="180px"
        />
      </div>
    </a>
  );
}

/** Duplicated for a seamless infinite marquee loop. */
const MARQUEE_ITEMS = [
  ...HOME_BRAND_SLIDER_ITEMS,
  ...HOME_BRAND_SLIDER_ITEMS,
];

export function HomeBrandsSlider() {
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
          <div
            className="group overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]"
            aria-label="Brand logos"
          >
            <div
              className={cn(
                "flex w-max gap-3 sm:gap-4",
                "animate-brand-marquee motion-reduce:animate-none",
                "group-hover:[animation-play-state:paused] hover:[animation-play-state:paused]",
              )}
              role="list"
            >
              {MARQUEE_ITEMS.map((brand, index) => (
                <div
                  key={`${brand.name}-${index}`}
                  role="listitem"
                  className="shrink-0"
                >
                  <BrandSlide
                    name={brand.name}
                    href={brand.href}
                    logoSrc={brand.logoSrc}
                  />
                </div>
              ))}
            </div>
          </div>
        </MotionFadeUp>
      </div>
    </MotionSection>
  );
}
