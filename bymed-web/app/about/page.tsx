import { getPageBySlug } from "@/lib/api/content";
import { ApiError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { cache } from "react";

type AboutContentSections = {
  overview: string[];
  mission: string[];
  services: string[];
};

type AboutContentShape = {
  companyOverview?: unknown;
  overview?: unknown;
  mission?: unknown;
  services?: unknown;
};

export const revalidate = 3600;

const getAboutPageContent = cache(async () => getPageBySlug("about"));

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function parseAboutContent(content: string): AboutContentSections {
  try {
    const parsed = JSON.parse(content) as AboutContentShape;
    const overview = asStringArray(parsed.companyOverview ?? parsed.overview);
    const mission = asStringArray(parsed.mission);
    const services = asStringArray(parsed.services);
    if (overview.length || mission.length || services.length) {
      return { overview, mission, services };
    }
  } catch {
    // Fall through to plain text parsing.
  }

  const paragraphs = content
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    overview: paragraphs,
    mission: [],
    services: [],
  };
}

function withFallback(values: string[], fallback: string[]): string[] {
  return values.length > 0 ? values : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "About | ByMed Medical & Scientific";
  const fallbackDescription =
    "Learn about ByMed, our mission, and the medical and scientific services we provide.";

  try {
    const page = await getAboutPageContent();
    const title = page.metadata.metaTitle?.trim() || `${page.title} | ByMed`;
    const description = page.metadata.metaDescription?.trim() || fallbackDescription;
    const canonical = absoluteUrl("/about");
    const ogImage = page.metadata.ogImage?.trim() || undefined;

    return {
      title,
      description,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
      },
    };
  }
}

export default async function AboutPage() {
  try {
    const page = await getAboutPageContent();
    const parsed = parseAboutContent(page.content);
    const overview = withFallback(parsed.overview, [
      "ByMed Medical & Scientific supplies reliable equipment and consumables for laboratories, clinics, and healthcare facilities.",
    ]);
    const mission = withFallback(parsed.mission, [
      "Our mission is to make high-quality medical and scientific products accessible with dependable support.",
    ]);
    const services = withFallback(parsed.services, [
      "Technical consultation for product selection.",
      "After-sales support for equipment usage.",
      "Guidance on procurement and replenishment planning.",
    ]);

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {page.title || "About ByMed"}
          </h1>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Company Overview</h2>
          {overview.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Mission</h2>
          {mission.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Services</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "We could not load this page right now. Please try again shortly.";

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          About ByMed
        </h1>
        <p className="mt-4 text-muted-foreground" role="alert">
          {message}
        </p>
      </div>
    );
  }
}
