import {
  SITE_BUSINESS,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site-seo";
import { absoluteUrl } from "@/lib/site-url";

/** Organization + WebSite + LocalBusiness graph for rich results and brand entity recognition. */
export function buildSiteOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = absoluteUrl("/");
  const logoUrl = absoluteUrl("/images/bymed-logo.webp");
  const orgId = siteUrl ? `${siteUrl}#organization` : undefined;
  const websiteId = siteUrl ? `${siteUrl}#website` : undefined;
  const localBusinessId = siteUrl ? `${siteUrl}#localbusiness` : undefined;

  const areaServed = SITE_BUSINESS.areaServed.map((name) => ({
    "@type": name === "Zimbabwe" ? "Country" : "City",
    name,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        url: siteUrl ?? SITE_BUSINESS.url,
        logo: logoUrl ?? undefined,
        description: SITE_DEFAULT_DESCRIPTION,
        email: SITE_BUSINESS.email,
        telephone: SITE_BUSINESS.telephone,
        sameAs: [SITE_BUSINESS.url],
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_BUSINESS.addressLocality,
          addressCountry: SITE_BUSINESS.addressCountry,
        },
        areaServed,
        knowsAbout: [
          "Medical equipment distribution",
          "Laboratory equipment",
          "Hospital equipment",
          "Biomedical equipment service",
          "Medical equipment training",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        url: siteUrl ?? SITE_BUSINESS.url,
        description: SITE_DEFAULT_DESCRIPTION,
        publisher: { "@id": orgId },
        inLanguage: "en-ZW",
        potentialAction: {
          "@type": "SearchAction",
          target: siteUrl
            ? `${siteUrl}products?q={search_term_string}`
            : undefined,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["MedicalBusiness", "LocalBusiness"],
        "@id": localBusinessId,
        name: SITE_NAME,
        url: siteUrl ?? SITE_BUSINESS.url,
        description: SITE_DEFAULT_DESCRIPTION,
        email: SITE_BUSINESS.email,
        telephone: SITE_BUSINESS.telephone,
        image: logoUrl ?? undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_BUSINESS.addressLocality,
          addressCountry: SITE_BUSINESS.addressCountry,
        },
        areaServed,
        priceRange: "$$",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "17:00",
        },
      },
    ],
  };
}
