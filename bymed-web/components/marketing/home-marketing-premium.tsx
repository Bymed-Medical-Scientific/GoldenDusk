"use client";

import { buttonVariants } from "@/components/ui/button";
import type { HomeMarketingContent } from "@/lib/content/marketing-pages";
import { resolvedHeroSlides } from "@/lib/content/marketing-pages";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { HomeBrandsSlider } from "./home-brands-slider";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { HomeWhatWeOfferSection } from "./home-what-we-offer-section";
import { MotionFadeUp, MotionSection } from "./motion-section";

export type HomeFeaturedProduct = {
  id: string;
  name: string;
  categoryName: string;
  imageUrl?: string;
  imageAlt: string;
};

function featuredPlaceholderDataUrl(title: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f3ab8"/>
      <stop offset="100%" stop-color="#0000cc"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <circle cx="170" cy="170" r="110" fill="rgba(255,255,255,0.14)"/>
  <circle cx="1040" cy="760" r="160" fill="rgba(255,255,255,0.12)"/>
  <text x="600" y="470" text-anchor="middle" fill="#ffffff" font-size="56" font-family="Arial, sans-serif" font-weight="700">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const PLACEHOLDER_FEATURED: HomeFeaturedProduct[] = [
  {
    id: "placeholder-1",
    name: "Ultrasound X-PRO 500",
    categoryName: "Diagnostic imaging",
    imageUrl: featuredPlaceholderDataUrl("Diagnostic Imaging"),
    imageAlt: "Medical imaging equipment",
  },
  {
    id: "placeholder-2",
    name: "Lab Analyzer LX-200",
    categoryName: "Laboratory",
    imageUrl: featuredPlaceholderDataUrl("Laboratory"),
    imageAlt: "Laboratory equipment",
  },
  {
    id: "placeholder-3",
    name: "Patient Monitor V9",
    categoryName: "Patient monitoring",
    imageUrl: featuredPlaceholderDataUrl("Patient Monitoring"),
    imageAlt: "Patient monitor",
  },
  {
    id: "placeholder-4",
    name: "Surgical Light LED-4K",
    categoryName: "Theatre",
    imageUrl: featuredPlaceholderDataUrl("Surgical Environment"),
    imageAlt: "Surgical environment",
  },
];

function FeaturedProductCard({ product }: { product: HomeFeaturedProduct }) {
  const isPlaceholder = product.id.startsWith("placeholder");
  const href = isPlaceholder ? "/products" : `/products/${product.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 25vw"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium text-muted-foreground">
          {product.categoryName}
        </p>
        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          <Link href={href} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary"
        >
          Inquire for pricing
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

export function HomeMarketingPremium({
  data,
  featuredProducts = [],
}: {
  data: HomeMarketingContent;
  featuredProducts?: HomeFeaturedProduct[];
}) {
  const heroSlides = resolvedHeroSlides(data);
  const catalogItems: HomeFeaturedProduct[] =
    featuredProducts.length >= 4
      ? featuredProducts.slice(0, 4)
      : featuredProducts.length === 0
        ? [...PLACEHOLDER_FEATURED]
        : (() => {
            const row = [...featuredProducts];
            for (let i = row.length; i < 4; i++) {
              row.push(PLACEHOLDER_FEATURED[i]);
            }
            return row;
          })();
  const whyCards = data.differentiators.slice(0, 3);

  return (
    <div className="bg-background text-foreground">
      {/*
        Pull hero under the sticky site header so transparent nav sits on the dark carousel,
        not the page body (which made light-theme overlay links white-on-white).
      */}
      <header
        aria-label="Introduction"
        className="relative z-0 -mt-[4.5rem] sm:-mt-20"
      >
        <HomeHeroCarousel
          slides={heroSlides}
          primaryCta={data.primaryCta}
          secondaryCta={data.secondaryCta}
        />
      </header>

      <HomeWhatWeOfferSection data={data} />

      <HomeBrandsSlider />

      <MotionSection
        className="bg-muted py-16 text-foreground sm:py-20"
        aria-labelledby="featured-catalog-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MotionFadeUp className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="featured-catalog-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Featured catalog
            </h2>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "link" }),
                "h-auto p-0 text-primary",
              )}
            >
              View entire catalog
            </Link>
          </MotionFadeUp>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {catalogItems.map((p) => (
              <MotionFadeUp key={p.id}>
                <FeaturedProductCard product={p} />
              </MotionFadeUp>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection
        className="mx-auto max-w-7xl bg-background px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="why-choose-us-heading"
      >
        <MotionFadeUp className="max-w-3xl">
          <p className="font-script text-2xl text-primary sm:text-3xl">
            Built for confidence
          </p>
          <h2
            id="why-choose-us-heading"
            className="font-heading mt-2 text-3xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl"
          >
            Why Choose Us
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {data.whySub}
          </p>
        </MotionFadeUp>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {whyCards.map((item) => (
            <MotionFadeUp key={item.title}>
              <article className="h-full rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/70">
                <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.body}
                </p>
              </article>
            </MotionFadeUp>
          ))}
        </div>
      </MotionSection>

      <MotionSection
        className="bg-muted py-16 text-foreground sm:py-20"
        aria-labelledby="final-cta-heading"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <MotionFadeUp>
            <p className="font-script text-3xl text-primary sm:text-4xl">
              Get in touch
            </p>
            <h2
              id="final-cta-heading"
              className="font-heading mt-2 text-3xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl"
            >
              Ready to upgrade your medical facility?
            </h2>
            <p className="mt-4 text-muted-foreground sm:text-lg">
              Speak with our sales engineers about specifications, timelines,
              and training—or browse the full product range online.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground shadow-md transition hover:bg-brand-hover"
              >
                Contact sales team
              </Link>
              <Link
                href="/products"
                className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-card px-8 text-sm font-semibold text-card-foreground ring-1 ring-border transition hover:bg-muted"
              >
                Download catalog
              </Link>
            </div>
          </MotionFadeUp>
        </div>
      </MotionSection>
    </div>
  );
}
