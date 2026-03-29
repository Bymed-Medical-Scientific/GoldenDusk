"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import type { HomeMarketingContent } from "@/lib/content/marketing-pages";
import { resolvedHeroSlides } from "@/lib/content/marketing-pages";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Baby,
  ChevronRight,
  GraduationCap,
  Microscope,
  Package,
  Quote,
  Scan,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { MotionFadeUp, MotionLi, MotionSection } from "./motion-section";

function offeringIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("point")) return Stethoscope;
  if (t.includes("theatre") || t.includes("surgical")) return Syringe;
  if (t.includes("teaching") || t.includes("education")) return GraduationCap;
  if (t.includes("instrument") || t.includes("consumable")) return Package;
  if (t.includes("imaging")) return Scan;
  if (t.includes("icu") || t.includes("scbu")) return Baby;
  return Microscope;
}

export function HomeMarketingPremium({ data }: { data: HomeMarketingContent }) {
  const heroSlides = resolvedHeroSlides(data);

  return (
    <div className="bg-background text-foreground">
      <header aria-label="Introduction">
        <HomeHeroCarousel
          slides={heroSlides}
          primaryCta={data.primaryCta}
          secondaryCta={data.secondaryCta}
        />
      </header>

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />

        <MotionSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="what-we-offer"
        >
          <MotionFadeUp className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Capabilities
            </p>
            <h2
              id="what-we-offer"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {data.whatWeOfferHeading}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {data.whatWeOfferIntro}
            </p>
          </MotionFadeUp>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.offerings.map(({ title, blurb }) => {
              const Icon = offeringIcon(title);
              return (
                <MotionLi key={title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Card className="group h-full border-border/80 bg-card/80 shadow-premium-sm backdrop-blur-sm transition-shadow duration-300 hover:border-primary/25 hover:shadow-premium">
                      <CardHeader className="gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-teal/10 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                          <Icon className="size-6" aria-hidden />
                        </div>
                        <CardTitle className="font-heading text-lg leading-snug">
                          {title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {blurb}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </MotionLi>
              );
            })}
          </ul>

          <MotionFadeUp className="mt-10">
            <Link
              href="/products"
              className={buttonVariants({
                variant: "ghost",
                className:
                  "group h-auto gap-1 px-0 text-primary hover:bg-transparent hover:text-primary/90",
              })}
            >
              {data.catalogueLinkLabel.replace(/→/g, "").trim()}
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </MotionFadeUp>
        </MotionSection>

        <MotionSection
          className="border-y border-border/80 bg-muted/40 py-16 backdrop-blur-sm dark:bg-muted/20 sm:py-20"
          aria-labelledby="product-spotlight"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <MotionFadeUp className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal dark:text-teal-muted">
                  Product spotlight
                </p>
                <h2
                  id="product-spotlight"
                  className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  Explore by clinical and lab category
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Hover a card for a quick preview—every range ties back to our
                  full catalogue and services team.
                </p>
              </div>
              <Link
                href="/products"
                className={buttonVariants({ className: "shrink-0" })}
              >
                Browse all products
              </Link>
            </MotionFadeUp>

            <MotionFadeUp className="mt-10">
              <Carousel
                opts={{ align: "start", loop: false }}
                className="w-full"
              >
                <CarouselContent className="-ml-3 md:-ml-4">
                  {data.offerings.map(({ title, blurb }) => {
                    const Icon = offeringIcon(title);
                    return (
                      <CarouselItem
                        key={`spot-${title}`}
                        className="basis-full pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3"
                      >
                        <motion.div
                          whileHover={{ y: -3 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 28,
                          }}
                        >
                          <Link
                            href="/products"
                            className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <Card className="h-full overflow-hidden border-border/70 bg-gradient-to-b from-card to-muted/30 shadow-premium-sm transition-shadow hover:shadow-premium">
                              <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-primary/10 via-background to-teal/5">
                                <Icon
                                  className="size-14 text-primary/80"
                                  aria-hidden
                                />
                              </div>
                              <CardHeader>
                                <CardTitle className="font-heading text-base">
                                  {title}
                                </CardTitle>
                                <CardDescription className="line-clamp-3">
                                  {blurb}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                  View in store
                                  <ChevronRight className="size-3.5" />
                                </span>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0 sm:-left-4" />
                <CarouselNext className="right-0 sm:-right-4" />
              </Carousel>
            </MotionFadeUp>
          </div>
        </MotionSection>

        <MotionSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="trusted-brands"
        >
          <MotionFadeUp>
            <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-premium">
              <CardContent className="grid gap-8 p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-12 sm:p-10 lg:p-12">
                <div>
                  <h2
                    id="trusted-brands"
                    className="text-2xl font-semibold tracking-tight sm:text-3xl"
                  >
                    {data.brandsHeading}
                  </h2>
                  <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg">
                    {data.brandsIntro}
                  </p>
                  <Link
                    href="/products"
                    className={buttonVariants({
                      variant: "link",
                      className: "mt-6 h-auto px-0 text-primary",
                    })}
                  >
                    {data.brandsLinkLabel.replace(/→/g, "").trim()}
                    <ChevronRight className="ml-1 size-4" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3 sm:flex-col sm:items-stretch">
                  {["ISO-minded sourcing", "Warranty pathways", "Local support"].map(
                    (label) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium backdrop-blur-sm"
                      >
                        <ShieldCheck className="size-4 shrink-0 text-teal" />
                        {label}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionFadeUp>
        </MotionSection>

        <MotionSection
          className="border-t border-border/80 bg-muted/30 py-16 dark:bg-muted/15 sm:py-20"
          aria-labelledby="why-choose"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <MotionFadeUp className="max-w-2xl">
              <h2
                id="why-choose"
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                {data.whyHeading}
              </h2>
              <p className="mt-4 text-xl font-medium text-foreground sm:text-2xl">
                {data.whyLead}
              </p>
              <p className="mt-3 text-muted-foreground sm:text-lg">
                {data.whySub}
              </p>
            </MotionFadeUp>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  n: `${data.offerings.length}+`,
                  label: "Offering areas",
                  sub: "Across care & education",
                },
                {
                  n: `${data.differentiators.length}`,
                  label: "Core pillars",
                  sub: "How we partner with you",
                },
                {
                  n: "ZW",
                  label: "Nationwide",
                  sub: "Zimbabwe-focused support",
                },
              ].map((stat) => (
                <MotionFadeUp key={stat.label}>
                  <div className="rounded-2xl border border-border/70 bg-card/90 p-6 text-center shadow-premium-sm backdrop-blur-sm">
                    <p className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                      {stat.n}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{stat.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.sub}
                    </p>
                  </div>
                </MotionFadeUp>
              ))}
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {data.differentiators.map(({ title: heading, body }) => (
                <MotionLi key={heading}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <Card className="h-full border-border/80 transition-shadow hover:shadow-premium">
                      <CardHeader>
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles className="size-4 shrink-0" aria-hidden />
                          <CardTitle className="font-heading text-base">
                            {heading}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {body}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </MotionLi>
              ))}
            </ul>

            <MotionFadeUp className="mt-10">
              <Link
                href="/services"
                className={buttonVariants({
                  variant: "outline",
                  className: "gap-1",
                })}
              >
                {data.servicesLinkLabel.replace(/→/g, "").trim()}
                <ChevronRight className="size-4" />
              </Link>
            </MotionFadeUp>
          </div>
        </MotionSection>

        <MotionSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="testimonials-heading"
        >
          <MotionFadeUp className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Trusted by teams
            </p>
            <h2
              id="testimonials-heading"
              className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              What our clients say
            </h2>
          </MotionFadeUp>

          <MotionFadeUp className="relative mx-auto mt-12 max-w-4xl">
            <Carousel opts={{ align: "center", loop: true }} className="w-full">
              <CarouselContent>
                {data.testimonials.map((t) => (
                  <CarouselItem key={t.author + t.quote.slice(0, 12)}>
                    <Card className="mx-2 border-border/70 bg-card/95 shadow-premium backdrop-blur-sm">
                      <CardContent className="flex flex-col gap-6 p-8 sm:flex-row sm:items-start sm:gap-8 sm:p-10">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Quote className="size-5" aria-hidden />
                        </div>
                        <div>
                          <p className="text-balance text-lg leading-relaxed text-foreground sm:text-xl">
                            &ldquo;{t.quote}&rdquo;
                          </p>
                          <Separator className="my-6" />
                          <p className="font-semibold text-foreground">
                            {t.author}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 sm:-left-12" />
              <CarouselNext className="right-0 sm:-right-12" />
            </Carousel>
          </MotionFadeUp>
        </MotionSection>

        <MotionSection
          className="border-t border-border/80 bg-gradient-to-br from-primary/8 via-background to-teal/5 py-16 dark:from-primary/15 dark:via-background sm:py-20"
          aria-labelledby="contact-cta"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <MotionFadeUp className="mx-auto max-w-3xl text-center">
              <Wrench
                className="mx-auto size-10 text-primary opacity-90"
                aria-hidden
              />
              <h2
                id="contact-cta"
                className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                {data.contactHeading}
              </h2>
              <p className="mt-4 text-muted-foreground sm:text-lg">
                {data.contactIntro}
              </p>
              <Link
                href="/contact"
                className={buttonVariants({
                  size: "lg",
                  className: "mt-8 h-11 px-8 shadow-premium",
                })}
              >
                {data.contactCtaLabel}
              </Link>
            </MotionFadeUp>
          </div>
        </MotionSection>
      </div>
    </div>
  );
}
