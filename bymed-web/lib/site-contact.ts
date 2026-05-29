/**
 * Company contact shown in the site footer (Requirement 14.5).
 * Keep in sync with property tests: Property 39 — Footer Contact Information.
 */
export const siteFooterContact = {
  email: "info@bymed.co.zw",
  phoneDisplay: "+263 71 576 6050",
  hoursLine: "Mon–Fri, 8:00–17:00 (CAT)",
} as const;

export const siteFooterMailtoHref =
  `mailto:${siteFooterContact.email}` as const;

export const siteFooterTelHref = "tel:+263715766050" as const;

/** E.164 without + for wa.me links */
export const siteWhatsAppNumber = "263715766050" as const;

const whatsAppDefaultMessage = encodeURIComponent(
  "Hello ByMed, I would like a quote or consultation for medical/scientific equipment in Zimbabwe.",
);

export const siteWhatsAppHref =
  `https://wa.me/${siteWhatsAppNumber}?text=${whatsAppDefaultMessage}` as const;
