"use client";

import { buttonVariants } from "@/components/ui/button";
import type { HomeMarketingContent } from "@/lib/content/marketing-pages";
import { resolvedHeroSlides } from "@/lib/content/marketing-pages";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import { cn } from "@/lib/utils";
import {
  Cpu,
  FlaskConical,
  Microscope,
  Stethoscope,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { MotionFadeUp, MotionSection } from "./motion-section";

export type HomeFeaturedProduct = {
  id: string;
  name: string;
  categoryName: string;
  imageUrl?: string;
  imageAlt: string;
};

const TRUSTED_BRANDS = [
  "Roche",
  "Philips",
  "GE Healthcare",
  "Terumo",
  "Olympus",
] as const;

const SERVICE_HIGHLIGHTS = [
  {
    title: "Seamless installation",
    body: "Certified technicians configure and validate equipment on-site so your teams can go live with confidence and minimal disruption.",
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774519?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Clinician training",
    body: "Hands-on programmes tailored to wards, theatres, and labs—covering safe operation, routine maintenance, and troubleshooting.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "24/7 maintenance",
    body: "Rapid response and planned servicing to protect uptime for critical care, imaging, and laboratory assets when it matters most.",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  },
] as const;

const STATS = [
  { value: "20+", label: "Years experience" },
  { value: "150+", label: "Global partners" },
  { value: "1.2k", label: "Projects completed" },
  { value: "24/7", label: "Support response" },
] as const;

const PLACEHOLDER_FEATURED: HomeFeaturedProduct[] = [
  {
    id: "placeholder-1",
    name: "Ultrasound X-PRO 500",
    categoryName: "Diagnostic imaging",
    imageUrl:
      "https://images.unsplash.com/photo-1516549655169-df83a0774519?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Medical imaging equipment",
  },
  {
    id: "placeholder-2",
    name: "Lab Analyzer LX-200",
    categoryName: "Laboratory",
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Laboratory equipment",
  },
  {
    id: "placeholder-3",
    name: "Patient Monitor V9",
    categoryName: "Patient monitoring",
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Patient monitor",
  },
  {
    id: "placeholder-4",
    name: "Surgical Light LED-4K",
    categoryName: "Theatre",
    imageUrl:
      "https://images.unsplash.com/photo-1551190822-a9333d879a1f?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Surgical environment",
  },
];

function ecosystemIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("point") || t.includes("care")) return Stethoscope;
  if (t.includes("theatre") || t.includes("surgical")) return Microscope;
  if (t.includes("teaching") || t.includes("education")) return FlaskConical;
  if (t.includes("instrument") || t.includes("consumable")) return Cpu;
  if (t.includes("imaging")) return Microscope;
  return Wrench;
}

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
  const ecosystemCards = data.offerings.slice(0, 4);
  const testimonial = data.testimonials[0] ?? {
    quote:
      "Their team delivered on time, trained our staff thoroughly, and our imaging downtime dropped immediately.",
    author: "Dr. Sarah Thompson",
    role: "Chief of Radiology",
  };

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

      <section
        className="bg-muted py-12 text-foreground sm:py-14"
        aria-label="Trusted partners"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by global industry leaders
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14 lg:justify-between">
            {TRUSTED_BRANDS.map((name) => (
              <li key={name}>
                <span className="font-heading text-lg font-semibold tracking-tight text-foreground/55 grayscale sm:text-xl dark:text-foreground/45">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MotionSection
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="ecosystems-heading"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start lg:gap-16">
          <MotionFadeUp>
            <p className="font-script text-2xl text-primary sm:text-3xl">
              Built for precision
            </p>
            <h2
              id="ecosystems-heading"
              className="font-heading mt-2 text-3xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl"
            >
              {data.whatWeOfferHeading}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {data.whatWeOfferIntro}
            </p>
          </MotionFadeUp>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystemCards.map(({ title, blurb }) => {
              const Icon = ecosystemIcon(title);
              return (
                <div
                  key={title}
                  className="rounded-2xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border/80"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {blurb}
                  </p>
                </div>
              );
            })}

            <div className="relative overflow-hidden rounded-2xl bg-[#0a2463] p-8 text-white shadow-lg sm:col-span-2 lg:col-span-2">
              <div
                className="pointer-events-none absolute -right-8 bottom-0 opacity-25"
                aria-hidden
              >
                <Cpu className="size-48 text-white" strokeWidth={1} />
              </div>
              <div className="relative z-[1] max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Engineering labs
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  Build teaching and R&amp;D spaces that scale
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
                  Turnkey layouts, durable benches, and equipment packages for
                  universities and technical colleges—aligned to curriculum and
                  industry standards.
                </p>
                <Link
                  href="/services"
                  className="mt-6 inline-flex text-sm font-semibold text-white underline-offset-4 hover:underline"
                >
                  Explore services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <section
        className="bg-muted py-16 text-foreground sm:py-20"
        aria-labelledby="featured-catalog-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {catalogItems.map((p) => (
              <FeaturedProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <MotionSection
        className="mx-auto max-w-7xl bg-background px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="service-highlights-heading"
      >
        <h2 id="service-highlights-heading" className="sr-only">
          Service highlights
        </h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {SERVICE_HIGHLIGHTS.map((item) => (
            <MotionFadeUp key={item.title}>
              <div className="flex h-full flex-col">
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <h3 className="font-heading mt-5 text-xl font-bold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.body}
                </p>
              </div>
            </MotionFadeUp>
          ))}
        </div>
      </MotionSection>

      <section
        className="bg-[#0a2463] py-16 text-white dark:bg-[#0c1a3a] sm:py-20"
        aria-labelledby="stats-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 id="stats-heading" className="sr-only">
              By the numbers
            </h2>
            <div className="grid grid-cols-2 gap-8 sm:gap-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {s.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white/75">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md ring-1 ring-white/15 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Client testimonial
            </p>
            <blockquote className="mt-4 text-lg leading-relaxed text-white/95 sm:text-xl">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                {testimonial.author
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-white/70">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
