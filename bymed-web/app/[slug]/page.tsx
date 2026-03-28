import {
  AboutMarketingView,
  ServicesMarketingView,
} from "@/components/marketing/cms-marketing-views";
import { loadMarketingPage } from "@/lib/content/load-marketing-page";
import {
  DEFAULT_ABOUT_MARKETING,
  DEFAULT_SERVICES_MARKETING,
  parseAboutMarketingContent,
  parseServicesMarketingContent,
} from "@/lib/content/marketing-pages";
import { sanitizeCmsBodyHtml } from "@/lib/content/sanitize-cms-html";
import { listContentPages } from "@/lib/api/content";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const dynamicParams = true;

const STRUCTURED_MARKETING_SLUGS = new Set(["about", "services"]);

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const p = await listContentPages({ pageNumber: 1, pageSize: 100 });
    return p.items
      .filter((i) => i.slug !== "home" && i.isPublished)
      .map((i) => ({ slug: i.slug }));
  } catch {
    return [{ slug: "about" }, { slug: "services" }];
  }
}

function canonicalPathForSlug(slug: string): string {
  return `/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  if (slug === "home") {
    return {};
  }

  const page = await loadMarketingPage(slug);
  if (!page) {
    return { title: "Not found" };
  }

  if (STRUCTURED_MARKETING_SLUGS.has(slug)) {
    const parsed =
      slug === "about"
        ? parseAboutMarketingContent(page.content, DEFAULT_ABOUT_MARKETING)
        : parseServicesMarketingContent(page.content, DEFAULT_SERVICES_MARKETING);
    const title =
      page.metadata?.metaTitle?.trim() || parsed.metaTitle;
    const description =
      page.metadata?.metaDescription?.trim() || parsed.metaDescription;
    const canonical = absoluteUrl(canonicalPathForSlug(slug));
    const ogTitle = page.metadata?.metaTitle?.trim() || parsed.ogTitle;
    const ogImage = page.metadata?.ogImage?.trim() || undefined;
    const twitterTitle =
      page.metadata?.metaTitle?.trim() || parsed.twitterTitle;

    return {
      title,
      description,
      keywords: parsed.keywords,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: ogTitle,
        description,
        type: "website",
        url: canonical,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title: twitterTitle,
        description,
      },
    };
  }

  const title =
    page.metadata?.metaTitle?.trim() || page.title;
  const description =
    page.metadata?.metaDescription?.trim() ||
    `ByMed — ${page.title}`;
  const canonical = absoluteUrl(canonicalPathForSlug(slug));
  const ogImage = page.metadata?.ogImage?.trim() || undefined;

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
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function CmsBySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  if (slug === "home") {
    notFound();
  }

  const page = await loadMarketingPage(slug);
  if (!page) {
    notFound();
  }

  if (slug === "about") {
    const data = parseAboutMarketingContent(
      page.content,
      DEFAULT_ABOUT_MARKETING,
    );
    return <AboutMarketingView data={data} />;
  }

  if (slug === "services") {
    const data = parseServicesMarketingContent(
      page.content,
      DEFAULT_SERVICES_MARKETING,
    );
    return <ServicesMarketingView data={data} />;
  }

  const safe = sanitizeCmsBodyHtml(page.content);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {page.title}
        </h1>
      </header>
      <div
        className="cms-body max-w-none space-y-4 text-foreground [&_a]:text-brand [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </article>
  );
}
