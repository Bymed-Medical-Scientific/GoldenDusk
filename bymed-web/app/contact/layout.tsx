import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SITE_BUSINESS, SITE_NAME } from "@/lib/seo/site-seo";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Contact us";
const description =
  "Contact ByMed Medical & Scientific in Bulawayo, Zimbabwe — product quotes, clinical support, equipment service, and procurement for hospitals, laboratories, and universities.";
const canonical = absoluteUrl("/contact");

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "contact ByMed Zimbabwe",
    "medical equipment supplier Bulawayo",
    "request quote medical equipment",
    "hospital equipment Zimbabwe",
  ],
  alternates: canonical ? { canonical } : undefined,
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    type: "website",
    url: canonical,
  },
};

function contactPageJsonLd(): Record<string, unknown> {
  const url = absoluteUrl("/contact");
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    url: url ?? undefined,
    mainEntity: {
      "@type": "MedicalBusiness",
      name: SITE_NAME,
      url: absoluteUrl("/") ?? SITE_BUSINESS.url,
      email: SITE_BUSINESS.email,
      telephone: SITE_BUSINESS.telephone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE_BUSINESS.addressLocality,
        addressCountry: SITE_BUSINESS.addressCountry,
      },
      areaServed: { "@type": "Country", name: "Zimbabwe" },
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
