"use client";

import type { HomeMarketingContent } from "@/lib/content/marketing-pages";
import { MotionFadeUp, MotionSection } from "./motion-section";
import Image from "next/image";

const OFFER_CATEGORY_ORDER = [
  "Technical Teaching Equipment",
  "Medical Teaching Equipment",
  "Industrial and Laboratory Scales",
  "Autoclaves & Sterilizers",
  "ICU/SCBU",
  "Point of Care",
  "Theatre Equipment",
  "Hospital Furniture",
  "Orthopedic Implants",
  "Surgical Instruments",
  "Imaging",
  "Consumables",
] as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function imageForCategory(title: string): string {
  const key = normalize(title);
  if (key.includes("technical teaching")) return "/images/technical-teaching.jpg";
  if (key.includes("medical teaching")) return "/images/medical-teaching.jpg";
  if (key.includes("scales")) return "/images/industrial-lab-scales.png";
  if (key.includes("imaging")) return "/images/imaging.webp";
  if (key.includes("point of care"))
    return "/images/CH155f_PP_001-852f2e8b.webp";
  if (key.includes("icu") || key.includes("scbu")) return "/images/icu-scbu.png";
  if (key.includes("theatre")) return "/images/tekno-operating.webp";
  if (key.includes("hospital furniture")) return "/images/furniture.jpg";
  if (key.includes("hospital")) return "/images/main-picture.jpg";
  if (key.includes("orthopedic") || key.includes("implant"))
    return "/images/orthopaedic-implants.jpg";
  if (key.includes("autoclave") || key.includes("sterilizer"))
    return "/images/autoclave.webp";
  if (key.includes("instruments")) return "/images/instrument.jpg";
  if (key.includes("consumables"))
    return "/images/consumables.png";
  return "/images/main-picture.jpg";
}

export function HomeWhatWeOfferSection({ data }: { data: HomeMarketingContent }) {
  const { whatWeOfferHeading, whatWeOfferIntro, offerings } = data;
  const offeringLookup = new Map(
    offerings.map((offering) => [normalize(offering.title), offering]),
  );
  const categories = OFFER_CATEGORY_ORDER.map((title) => {
    const normalized = normalize(title);
    const fallbackForCombined =
      normalized === normalize("Instruments")
        ? offeringLookup.get(normalize("Instruments and Consumables"))
        : normalized === normalize("Consumables")
          ? offeringLookup.get(normalize("Instruments and Consumables"))
          : undefined;
    const offering = offeringLookup.get(normalized) ?? fallbackForCombined;
    return {
      title,
      blurb: offering?.blurb ?? "",
      imageSrc: imageForCategory(title),
    };
  });

  return (
    <MotionSection
      className="bg-background py-16 text-foreground sm:py-20"
      aria-labelledby="what-we-offer-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 sm:gap-12">
          <MotionFadeUp className="mx-auto max-w-3xl text-center">
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

          <MotionFadeUp>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <article
                  key={category.title}
                  className="group relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
                >
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={category.imageSrc}
                      alt={category.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                    <h3 className="absolute bottom-3 left-3 right-3 text-lg font-semibold uppercase tracking-wide text-white">
                      {category.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </MotionFadeUp>
        </div>
      </div>
    </MotionSection>
  );
}
