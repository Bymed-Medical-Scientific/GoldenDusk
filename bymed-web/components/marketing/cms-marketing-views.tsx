import type {
  AboutMarketingContent,
  HomeMarketingContent,
  ServicesMarketingContent,
} from "@/lib/content/marketing-pages";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import { absoluteUrl } from "@/lib/site-url";
import Image from "next/image";
import Link from "next/link";
import {
  HomeMarketingPremium,
  type HomeFeaturedProduct,
} from "@/components/marketing/home-marketing-premium";

export function HomeMarketingView({
  data,
  featuredProducts,
}: {
  data: HomeMarketingContent;
  featuredProducts?: HomeFeaturedProduct[];
}) {
  return (
    <HomeMarketingPremium data={data} featuredProducts={featuredProducts} />
  );
}

export function AboutMarketingView({ data }: { data: AboutMarketingContent }) {
  const canonical = absoluteUrl("/about");
  const description = data.metaDescription;
  const stats = [
    { label: "Years of service", value: "15+" },
    { label: "Healthcare partners", value: "450+" },
    { label: "Installed systems", value: "1.2k" },
    { label: "Support availability", value: "24/7" },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: data.jsonLdName,
    description,
    url: canonical ?? undefined,
    isPartOf: {
      "@type": "WebSite",
      name: "ByMed Medical & Scientific",
      url: absoluteUrl("/") ?? undefined,
    },
    about: {
      "@type": "Organization",
      name: "ByMed Medical & Scientific",
      description:
        "Importer and distributor of medical, scientific, and engineering equipment and training in Zimbabwe.",
      url: absoluteUrl("/") ?? undefined,
      sameAs: "https://bymed.co.zw/",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-background text-foreground">
        <header
          className="relative z-0 -mt-[4.5rem] overflow-hidden text-white sm:-mt-20"
          aria-label="About introduction"
        >
          <div className="relative min-h-[100svh] w-full">
            <Image
              src="/images/main-picture.jpg"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent sm:h-40"
              aria-hidden
            />
            <div className="relative z-10 flex min-h-[100svh] flex-col pt-[4.5rem] sm:pt-20">
              <div className="flex flex-1 items-center">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl text-left text-white">
                    <p className="font-script text-2xl leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl md:text-[2rem]">
                      {data.headerEyebrow}
                    </p>
                    <h1 className="font-heading mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-white sm:mt-4 sm:text-4xl sm:leading-[1.06] lg:text-5xl xl:text-[3.35rem]">
                      {data.headerTitle}
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/88 sm:text-lg">
                      {data.headerSubtitle}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href="/contact"
                        className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-[1.02] hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                      >
                        Contact
                      </Link>
                      <Link
                        href="/products"
                        className="inline-flex h-12 min-h-12 items-center justify-center rounded-full border-0 bg-white/10 px-8 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgb(0_0_0_/_0.45)] backdrop-blur-sm transition-[transform,box-shadow] hover:bg-white/18 hover:shadow-[0_12px_32px_-10px_rgb(0_0_0_/_0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98]"
                      >
                        Explore Solutions
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 rounded-[1.75rem] bg-muted/45 p-4 ring-1 ring-border/70 md:grid-cols-[1.05fr_1fr] md:p-8">
            <div className="relative min-h-[18rem] overflow-hidden rounded-2xl bg-muted sm:min-h-[22rem]">
              <Image
                src="/images/medical-teaching.jpg"
                alt="ByMed team supporting healthcare and research operations"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
              />
            </div>
            <div className="self-center">
              <h2
                id="company-story"
                className="font-heading mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground sm:mt-4 sm:text-4xl sm:leading-[1.06] lg:text-5xl"
              >
                {data.overviewHeading}
              </h2>
              <div className="mt-4 space-y-4">
                {data.overviewParagraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/35 py-14 sm:py-20" aria-labelledby="purpose-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-script text-2xl text-primary sm:text-3xl">
                Our purpose
              </p>
              <h2
                id="purpose-heading"
                className="font-heading mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-[1.06] lg:text-5xl"
              >
                Our vision and mission
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Built on long-term impact, practical support, and trusted technology partnerships.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-white via-white to-[#eef3ff] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.28)] ring-1 ring-primary/10 transition-transform duration-200 hover:-translate-y-1 dark:from-card dark:via-card dark:to-muted/60 dark:shadow-black/30 sm:p-10">
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand to-primary/50"
                  aria-hidden
                />
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/25 blur-3xl transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl dark:bg-brand/15"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,204,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(0,0,204,0.12),transparent_38%)] opacity-90"
                  aria-hidden
                />
                <div className="relative">
                  <h2
                    id="vision-heading"
                    className="font-heading text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-[1.06]"
                  >
                    {data.visionTitle}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {data.visionText}
                  </p>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-white via-white to-[#eef3ff] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.28)] ring-1 ring-primary/10 transition-transform duration-200 hover:-translate-y-1 dark:from-card dark:via-card dark:to-muted/60 dark:shadow-black/30 sm:p-10">
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand to-primary/50"
                  aria-hidden
                />
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/25 blur-3xl transition-opacity duration-200 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl dark:bg-brand/15"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,204,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(0,0,204,0.12),transparent_38%)] opacity-90"
                  aria-hidden
                />
                <div className="relative">
                  <h2
                    id="mission-heading"
                    className="font-heading text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-4xl sm:leading-[1.06]"
                  >
                    {data.missionTitle}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {data.missionText}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-brand py-8 text-brand-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
            {stats.map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  {item.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-brand-foreground/85">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted py-14 sm:py-20" aria-labelledby="we-aim-to">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2
                id="we-aim-to"
                className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              >
                {data.aimsHeading}
              </h2>
            </div>
            <ul className="mt-8 space-y-3">
              {data.aims.map((item) => (
                <li
                  key={item}
                  className="rounded-xl bg-card px-4 py-4 text-sm leading-relaxed text-muted-foreground ring-1 ring-border/70 sm:px-5 sm:text-base"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"
          aria-labelledby="about-contact-cta"
        >
          <div className="mb-14 rounded-[2rem] bg-muted/45 p-6 sm:mb-16 sm:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                High quality products and trusted expertise
              </h2>
            </div>
            <ul
              className="mt-10 grid gap-4 md:grid-cols-3"
              aria-label="What defines Bymed"
            >
              {data.valueProps.map(({ title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/70"
                >
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Pillar
                  </span>
                  <h3 className="font-heading mt-4 text-xl font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm sm:p-10">
            <h2
              id="about-contact-cta"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {data.ctaTitle}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {data.ctaBody}
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex h-11 min-h-11 items-center justify-center rounded-full bg-brand px-7 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {data.ctaButtonLabel}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export function ServicesMarketingView({
  data,
}: {
  data: ServicesMarketingContent;
}) {
  const canonical = absoluteUrl("/services");
  const description = data.metaDescription;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.jsonLdName,
    description,
    url: canonical ?? undefined,
    isPartOf: {
      "@type": "WebSite",
      name: "ByMed Medical & Scientific",
      url: absoluteUrl("/") ?? undefined,
    },
    about: {
      "@type": "ProfessionalService",
      name: "ByMed equipment support services",
      serviceType:
        "Medical and laboratory equipment installation, training, repair, and maintenance",
      provider: {
        "@type": "Organization",
        name: "ByMed Medical & Scientific",
        url: absoluteUrl("/") ?? undefined,
        sameAs: "https://bymed.co.zw/",
      },
      areaServed: {
        "@type": "Country",
        name: "Zimbabwe",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-background text-foreground">
        <header className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-ink dark:text-brand">
              {data.headerEyebrow}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {data.headerTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
              {data.headerSubtitle}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
          <section aria-labelledby="comprehensive-support">
            <h2
              id="comprehensive-support"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {data.supportSectionTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {data.supportSectionIntro}
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {data.supportPillars.map(({ title, body }) => (
                <li
                  key={title}
                  className="rounded-xl border border-border bg-muted/20 p-6"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16" aria-labelledby="we-repair">
            <h2
              id="we-repair"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {data.repairSectionTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              {data.repairSectionIntro}
            </p>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {data.repairCategories.map(({ title, items }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section
            className="mt-16 rounded-xl border border-border bg-muted/25 p-8 sm:p-10"
            aria-labelledby="restore-heading"
          >
            <h2
              id="restore-heading"
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {data.restoreTitle}
            </h2>
            {data.restoreBody.map((para) => (
              <p key={para} className="mt-3 max-w-3xl text-muted-foreground">
                {para}
              </p>
            ))}
            <p className="mt-4 font-medium text-foreground">
              {data.restoreEmphasis}
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
            >
              {data.ctaButtonLabel}
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
