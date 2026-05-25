import { SITE_BUSINESS, SITE_DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/site-seo";
import { absoluteUrl } from "@/lib/site-url";

/** Organization + WebSite graph for rich results and brand entity recognition. */
export function buildSiteOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = absoluteUrl("/");
  const logoUrl = absoluteUrl("/images/bymed-logo.webp");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteUrl ? `${siteUrl}#organization` : undefined,
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
        areaServed: {
          "@type": "Country",
          name: "Zimbabwe",
        },
      },
      {
        "@type": "WebSite",
        "@id": siteUrl ? `${siteUrl}#website` : undefined,
        name: SITE_NAME,
        url: siteUrl ?? SITE_BUSINESS.url,
        description: SITE_DEFAULT_DESCRIPTION,
        publisher: { "@id": siteUrl ? `${siteUrl}#organization` : undefined },
        inLanguage: "en-ZW",
      },
      {
        "@type": "MedicalBusiness",
        "@id": siteUrl ? `${siteUrl}#localbusiness` : undefined,
        name: SITE_NAME,
        url: siteUrl ?? SITE_BUSINESS.url,
        description: SITE_DEFAULT_DESCRIPTION,
        email: SITE_BUSINESS.email,
        telephone: SITE_BUSINESS.telephone,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_BUSINESS.addressLocality,
          addressCountry: SITE_BUSINESS.addressCountry,
        },
        areaServed: {
          "@type": "Country",
          name: "Zimbabwe",
        },
        priceRange: "$$",
      },
    ],
  };
}
