import type {
  AboutMarketingContent,
  HomeMarketingContent,
  ServicesMarketingContent,
} from "@/lib/content/marketing-pages";
import { absoluteUrl } from "@/lib/site-url";
import Link from "next/link";

export function HomeMarketingView({ data }: { data: HomeMarketingContent }) {
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-ink dark:text-brand">
            {data.heroEyebrow}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {data.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {data.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={data.primaryCta.href}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {data.primaryCta.label}
            </Link>
            <Link
              href={data.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {data.secondaryCta.label}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="mx-auto max-w-5xl px-4 py-14 sm:py-16"
        aria-labelledby="what-we-offer"
      >
        <div className="max-w-2xl">
          <h2
            id="what-we-offer"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {data.whatWeOfferHeading}
          </h2>
          <p className="mt-2 text-muted-foreground">{data.whatWeOfferIntro}</p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.offerings.map(({ title: name, blurb }) => (
            <li
              key={name}
              className="rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/40"
            >
              <h3 className="text-base font-semibold text-foreground">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {blurb}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link
            href="/products"
            className="text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {data.catalogueLinkLabel}
          </Link>
        </p>
      </section>

      <section
        className="border-y border-border bg-muted/25"
        aria-labelledby="trusted-brands"
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
          <h2
            id="trusted-brands"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {data.brandsHeading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{data.brandsIntro}</p>
          <Link
            href="/products"
            className="mt-6 inline-flex text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
          >
            {data.brandsLinkLabel}
          </Link>
        </div>
      </section>

      <section
        className="mx-auto max-w-5xl px-4 py-14 sm:py-16"
        aria-labelledby="why-choose"
      >
        <h2
          id="why-choose"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {data.whyHeading}
        </h2>
        <p className="mt-2 max-w-2xl text-lg font-medium text-foreground">
          {data.whyLead}
        </p>
        <p className="mt-2 max-w-2xl text-muted-foreground">{data.whySub}</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {data.differentiators.map(({ title: heading, body }) => (
            <li key={heading} className="rounded-xl border border-border p-6">
              <h3 className="text-base font-semibold">{heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-10">
          <Link
            href="/services"
            className="text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {data.servicesLinkLabel}
          </Link>
        </p>
      </section>

      <section
        className="border-t border-border bg-muted/40"
        aria-labelledby="contact-cta"
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
          <h2
            id="contact-cta"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {data.contactHeading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {data.contactIntro}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted"
          >
            {data.contactCtaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function AboutMarketingView({ data }: { data: AboutMarketingContent }) {
  const canonical = absoluteUrl("/about");
  const description = data.metaDescription;
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
          <section className="space-y-4" aria-labelledby="company-story">
            <h2
              id="company-story"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {data.overviewHeading}
            </h2>
            {data.overviewParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>

          <ul
            className="mt-10 grid gap-4 sm:grid-cols-3"
            aria-label="What defines ByMed"
          >
            {data.valueProps.map(({ title, body }) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-muted/20 p-5"
              >
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="vision-heading">
              <h2
                id="vision-heading"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                {data.visionTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">{data.visionText}</p>
            </section>
            <section aria-labelledby="mission-heading">
              <h2
                id="mission-heading"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                {data.missionTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">{data.missionText}</p>
            </section>
          </div>

          <section className="mt-14" aria-labelledby="we-aim-to">
            <h2
              id="we-aim-to"
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {data.aimsHeading}
            </h2>
            <ul className="mt-6 space-y-4 border-l-2 border-brand pl-6">
              {data.aims.map((item) => (
                <li key={item} className="text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section
            className="mt-14 rounded-xl border border-border bg-muted/25 p-8"
            aria-labelledby="about-contact-cta"
          >
            <h2
              id="about-contact-cta"
              className="text-xl font-semibold tracking-tight"
            >
              {data.ctaTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{data.ctaBody}</p>
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
