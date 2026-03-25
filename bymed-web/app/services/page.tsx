import { getPageBySlug } from "@/lib/api/content";
import { ApiError } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { cache } from "react";

type ServicesContentSections = {
  introduction: string[];
  technicalTraining: string[];
  supportServices: string[];
  medicalEquipmentRepairs: string[];
};

type ServicesContentShape = {
  introduction?: unknown;
  overview?: unknown;
  technicalTraining?: unknown;
  training?: unknown;
  supportServices?: unknown;
  support?: unknown;
  medicalEquipmentRepairs?: unknown;
  repairs?: unknown;
};

export const revalidate = 3600;

const getServicesPageContent = cache(async () => getPageBySlug("services"));

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

function parseServicesContent(content: string): ServicesContentSections {
  try {
    const parsed = JSON.parse(content) as ServicesContentShape;
    const introduction = asStringArray(parsed.introduction ?? parsed.overview);
    const technicalTraining = asStringArray(
      parsed.technicalTraining ?? parsed.training,
    );
    const supportServices = asStringArray(parsed.supportServices ?? parsed.support);
    const medicalEquipmentRepairs = asStringArray(
      parsed.medicalEquipmentRepairs ?? parsed.repairs,
    );
    if (
      introduction.length ||
      technicalTraining.length ||
      supportServices.length ||
      medicalEquipmentRepairs.length
    ) {
      return {
        introduction,
        technicalTraining,
        supportServices,
        medicalEquipmentRepairs,
      };
    }
  } catch {
    // Fall through to plain text parsing.
  }

  const paragraphs = content
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    introduction: paragraphs,
    technicalTraining: [],
    supportServices: [],
    medicalEquipmentRepairs: [],
  };
}

function withFallback(values: string[], fallback: string[]): string[] {
  return values.length > 0 ? values : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "Services | ByMed Medical & Scientific";
  const fallbackDescription =
    "Explore ByMed technical training, support, and medical equipment repair services for medical and scientific teams.";

  try {
    const page = await getServicesPageContent();
    const title = page.metadata.metaTitle?.trim() || `${page.title} | ByMed`;
    const description = page.metadata.metaDescription?.trim() || fallbackDescription;
    const canonical = absoluteUrl("/services");
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

export default async function ServicesPage() {
  try {
    const page = await getServicesPageContent();
    const parsed = parseServicesContent(page.content);
    const introduction = withFallback(parsed.introduction, [
      "ByMed provides service programs that help teams deploy and operate medical and scientific equipment with confidence.",
    ]);
    const technicalTraining = withFallback(parsed.technicalTraining, [
      "Hands-on onboarding sessions for new equipment and workflows.",
      "Role-based training for technicians, clinicians, and lab operators.",
      "Refresher training plans for long-term operational consistency.",
    ]);
    const supportServices = withFallback(parsed.supportServices, [
      "Post-purchase technical guidance and troubleshooting.",
      "Usage and maintenance best-practice recommendations.",
      "Planning support for procurement, replacement, and scaling.",
    ]);
    const medicalEquipmentRepairs = withFallback(parsed.medicalEquipmentRepairs, [
      "Preventive and corrective repair support for medical equipment.",
      "Diagnostics and repair planning to reduce operational downtime.",
      "Guidance on replacement parts and service scheduling.",
    ]);

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {page.title || "Services"}
          </h1>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          {introduction.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Technical Training
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {technicalTraining.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Support Services</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {supportServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Medical Equipment Repairs
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {medicalEquipmentRepairs.map((service) => (
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
          Services
        </h1>
        <p className="mt-4 text-muted-foreground" role="alert">
          {message}
        </p>
      </div>
    );
  }
}
