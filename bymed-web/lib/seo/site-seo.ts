/**
 * Shared SEO copy and structured-data defaults for the Zimbabwe storefront.
 */
export const SITE_NAME = "ByMed Medical & Scientific";

export const SITE_DEFAULT_TITLE =
  "Medical Equipment Suppliers Zimbabwe | Laboratory & Hospital Equipment";

export const SITE_DEFAULT_DESCRIPTION =
  "ByMed Medical & Scientific is a trusted medical equipment supplier in Zimbabwe—hospitals, clinics, laboratories, and universities rely on us for laboratory equipment, hospital equipment in Harare and nationwide, installation, training, repairs, and local support from Bulawayo.";

export const SITE_DEFAULT_KEYWORDS = [
  "Bymed",
  "ByMed Medical and Scientific",
  "medical equipment suppliers Zimbabwe",
  "medical equipment suppliers in Zimbabwe",
  "medical equipment supplier Zimbabwe",
  "medical equipment Zimbabwe",
  "laboratory equipment Zimbabwe",
  "hospital equipment Harare",
  "hospital equipment Zimbabwe",
  "hospital equipment Bulawayo",
  "scientific equipment Zimbabwe",
  "laboratory supplies Zimbabwe",
  "laboratory scales Zimbabwe",
  "laboratory balances Zimbabwe",
  "industrial scales Zimbabwe",
  "industrial weighing scales Zimbabwe",
  "weighing scales supplier Zimbabwe",
  "point of care diagnostics Zimbabwe",
  "medical imaging equipment Zimbabwe",
  "X-ray equipment Zimbabwe",
  "ultrasound equipment Zimbabwe",
  "theatre equipment Zimbabwe",
  "ICU equipment Zimbabwe",
  "patient monitoring Zimbabwe",
  "autoclave Zimbabwe",
  "autoclave supplier Zimbabwe",
  "autoclave repair Zimbabwe",
  "autoclave repairs Zimbabwe",
  "sterilizer repair Zimbabwe",
  "CSSD equipment Zimbabwe",
  "technical teaching equipment Zimbabwe",
  "engineering teaching equipment Zimbabwe",
  "medical teaching equipment Zimbabwe",
  "anatomical models Zimbabwe",
  "simulation training equipment Zimbabwe",
  "medical equipment repair Zimbabwe",
  "hospital equipment maintenance Zimbabwe",
  "laboratory equipment service Zimbabwe",
  "biomedical equipment service Zimbabwe",
  "engineering education equipment Zimbabwe",
  "university laboratory equipment Zimbabwe",
  "orthopaedic implants Zimbabwe",
  "surgical instruments Zimbabwe",
  "medical consumables Zimbabwe",
  // === MEDICAL SIMULATION & ANATOMY MODELS ===
  "medical simulation equipment Zimbabwe",
  "anatomy models Zimbabwe",
  "medical training manikins Zimbabwe",
  "anatomical models Zimbabwe",
  "simulation manikins Zimbabwe",
  "nursing simulation equipment Zimbabwe",
  "clinical skills trainers Zimbabwe",
  "human skeleton model Zimbabwe",
  "medical education equipment Zimbabwe",
  "anatomy teaching models Harare",
  "surgical simulation trainers Zimbabwe",
  "patient simulators Zimbabwe",
  "medical school equipment Zimbabwe",
  "university laboratory models Zimbabwe",

  // Long-tail high-intent
  "anatomy models suppliers Zimbabwe",
  "medical simulation manikins Harare",
  "buy anatomy models Bulawayo",
  "nursing training manikins Zimbabwe",
  "advanced medical simulators Zimbabwe",
  "human organ models for education Zimbabwe",
  "CPR training manikins Zimbabwe",
  "medical simulation center equipment Zimbabwe",
] as const;

export const SITE_LOCALE = "en_ZW";

export const SITE_GEO_REGION = "ZW";

/** Used in Organization / LocalBusiness JSON-LD (keep aligned with contact page). */
export const SITE_BUSINESS = {
  name: SITE_NAME,
  url: "https://bymed.co.zw/",
  email: "info@bymed.co.zw",
  telephone: "+263715766050",
  addressLocality: "Bulawayo",
  addressCountry: "ZW",
  /** Cities and regions served (E-E-A-T: local presence + national coverage). */
  areaServed: ["Bulawayo", "Harare", "Zimbabwe"] as const,
} as const;
