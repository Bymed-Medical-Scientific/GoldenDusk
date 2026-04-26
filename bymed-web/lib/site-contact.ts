/**
 * Company contact shown in the site footer (Requirement 14.5).
 * Keep in sync with property tests: Property 39 — Footer Contact Information.
 */
export const siteFooterContact = {
  email: "support@bymed.co.zw",
  phoneDisplay: "+263 71 576 6050",
  hoursLine: "Mon–Fri, 8:00–17:00 (CAT)",
} as const;

export const siteFooterMailtoHref =
  `mailto:${siteFooterContact.email}` as const;

export const siteFooterTelHref = "tel:+263715766050" as const;
