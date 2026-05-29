import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildSocialMetadata } from "@/lib/seo/social-metadata";
import { SITE_BUSINESS, SITE_NAME } from "@/lib/seo/site-seo";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Request Quote & Contact | Medical Equipment Zimbabwe";
const description =
  "Request a quote, book a free equipment consultation, or contact ByMed in Bulawayo—medical and laboratory equipment suppliers serving hospitals, clinics, and universities across Zimbabwe including Harare.";
const canonicalPath = "/contact";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "request quote medical equipment Zimbabwe",
    "medical equipment supplier Bulawayo",
    "hospital equipment quote Harare",
    "laboratory equipment supplier Zimbabwe",
    "contact ByMed Zimbabwe",
  ],
  ...buildSocialMetadata({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath,
  }),
};

function contactPageJsonLd(): Record<string, unknown> {
  const url = absoluteUrl("/contact");
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: url ?? undefined,
    mainEntity: {
      "@type": ["MedicalBusiness", "LocalBusiness"],
      name: SITE_NAME,
      url: absoluteUrl("/") ?? SITE_BUSINESS.url,
      email: SITE_BUSINESS.email,
      telephone: SITE_BUSINESS.telephone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE_BUSINESS.addressLocality,
        addressCountry: SITE_BUSINESS.addressCountry,
      },
      areaServed: SITE_BUSINESS.areaServed.map((name) => ({
        "@type": name === "Zimbabwe" ? "Country" : "City",
        name,
      })),
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript data={contactPageJsonLd()} />
      {children}
    </>
  );
}
