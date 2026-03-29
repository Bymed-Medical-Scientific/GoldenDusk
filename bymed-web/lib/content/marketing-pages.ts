/**
 * Storefront marketing pages load body copy from the API (`GET /content/{slug}`).
 * Slugs: `home`, `about`, `services`.
 * Put JSON in `PageContent.content`; optional `PageMetadata` drives SEO when set.
 */

export type CtaLink = { label: string; href: string };

/** Optional CMS-driven hero slides; UI falls back to built-in themes if empty. */
export type HomeHeroSlide = {
  tag: string;
  title: string;
  subtitle: string;
  /** Optional background image URL (HTTPS). */
  imageSrc?: string;
};

export type HomeTestimonial = { quote: string; author: string; role: string };

export type HomeMarketingContent = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  keywords: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  /** When set (from CMS), replaces default hero carousel slides. */
  heroSlides: HomeHeroSlide[];
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  whatWeOfferHeading: string;
  whatWeOfferIntro: string;
  offerings: { title: string; blurb: string }[];
  catalogueLinkLabel: string;
  brandsHeading: string;
  brandsIntro: string;
  brandsLinkLabel: string;
  whyHeading: string;
  whyLead: string;
  whySub: string;
  differentiators: { title: string; body: string }[];
  servicesLinkLabel: string;
  contactHeading: string;
  contactIntro: string;
  contactCtaLabel: string;
  testimonials: HomeTestimonial[];
};

export type AboutMarketingContent = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  twitterTitle: string;
  jsonLdName: string;
  keywords: string[];
  headerEyebrow: string;
  headerTitle: string;
  headerSubtitle: string;
  overviewHeading: string;
  overviewParagraphs: string[];
  valueProps: { title: string; body: string }[];
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionText: string;
  aimsHeading: string;
  aims: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaButtonLabel: string;
};

export type ServicesMarketingContent = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  twitterTitle: string;
  jsonLdName: string;
  keywords: string[];
  headerEyebrow: string;
  headerTitle: string;
  headerSubtitle: string;
  supportSectionTitle: string;
  supportSectionIntro: string;
  supportPillars: { title: string; body: string }[];
  repairSectionTitle: string;
  repairSectionIntro: string;
  repairCategories: { title: string; items: string[] }[];
  restoreTitle: string;
  restoreBody: string[];
  restoreEmphasis: string;
  ctaButtonLabel: string;
};

export const DEFAULT_HOME_MARKETING: HomeMarketingContent = {
  metaTitle: "Home",
  metaDescription:
    "Shaping the future of healthcare, scientific research, and engineering education in Zimbabwe—point-of-care, theatre, imaging, ICU, teaching tools, and trusted brands.",
  ogTitle: "ByMed Medical & Scientific",
  keywords: [
    "ByMed",
    "medical equipment Zimbabwe",
    "scientific equipment",
    "laboratory supplies",
    "point of care",
    "medical imaging",
    "ICU equipment",
    "engineering education Zimbabwe",
  ],
  heroEyebrow: "Innovating medical excellence",
  heroTitle:
    "Shaping Zimbabwe’s future in healthcare, research, and engineering.",
  heroSubtitle:
    "With 20+ years of experience supplying medical equipment to leading institutions, we deliver precision tools that power discovery and save lives.",
  heroSlides: [
    {
      tag: "Innovating medical excellence",
      title:
        "Shaping Zimbabwe’s future in healthcare, research, and engineering.",
      subtitle:
        "With 20+ years of experience supplying medical equipment to leading institutions, we deliver precision tools that power discovery and save lives.",
    },
    {
      tag: "Technical teaching",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
    },
    {
      tag: "Medical teaching",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
    },
    {
      tag: "Industrial and lab scales",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
    },
    {
      tag: "Hospital Equipment",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
      imageSrc: "/images/tekno-operating.webp",
    },
  ],
  primaryCta: { label: "Browse Products", href: "/products" },
  secondaryCta: { label: "Request Quote", href: "/contact" },
  whatWeOfferHeading: "Comprehensive scientific ecosystems",
  whatWeOfferIntro:
    "From diagnostics and imaging to teaching labs and engineering workspaces—we help you build complete, reliable environments for care and discovery.",
  offerings: [
    {
      title: "Point of care",
      blurb: "Diagnostics and bedside solutions for clinics and wards.",
    },
    {
      title: "Theatre",
      blurb: "Surgical instruments, drapes, and theatre-ready consumables.",
    },
    {
      title: "Medical & technical teaching",
      blurb: "Training systems for universities and technical colleges.",
    },
    {
      title: "Instruments & consumables",
      blurb: "Reliable disposables and precision instruments for daily use.",
    },
    {
      title: "Imaging",
      blurb: "Support for diagnostic imaging workflows and accessories.",
    },
    {
      title: "ICU / SCBU",
      blurb: "Critical and neonatal care equipment when outcomes matter most.",
    },
  ],
  catalogueLinkLabel: "View product catalogue →",
  brandsHeading: "Trusted brands",
  brandsIntro:
    "We supply equipment and consumables from recognised manufacturers so you can standardise quality across your facility or campus.",
  brandsLinkLabel: "Explore brands in the store →",
  whyHeading: "Why choose us",
  whyLead: "Precision and innovation",
  whySub:
    "Partnerships, customisation, technology, and training—so you get solutions that fit Zimbabwe's healthcare and education landscape.",
  differentiators: [
    {
      title: "World-class partnerships",
      body: "We work with industry leaders such as MedicalCSE and EDIBON to bring leading medical, scientific, and engineering technologies to Zimbabwe.",
    },
    {
      title: "Tailored solutions",
      body: "From advanced medical devices to engineering research equipment, we customise approaches for universities, healthcare providers, and research institutions.",
    },
    {
      title: "Innovative technology",
      body: "We stay ahead of the curve with the latest innovations in medical, engineering, and scientific technologies.",
    },
    {
      title: "Expert training",
      body: "Our technical training division builds practical skills so people and organisations can thrive in fast-evolving industries.",
    },
  ],
  servicesLinkLabel: "Our services →",
  contactHeading: "We would love to hear from you",
  contactIntro:
    "Whether you need ECG technologies, science and research equipment, or training services, our team is here to help.",
  contactCtaLabel: "Contact us",
  testimonials: [
    {
      quote:
        "Their team delivered on time, trained our staff thoroughly, and our imaging downtime dropped immediately—we finally have a partner who understands acute care pressure.",
      author: "Dr. Sarah Thompson",
      role: "Chief of Radiology",
    },
    {
      quote:
        "Their training team made the difference—we went from unpacking boxes to confident daily use in under a week.",
      author: "Lab manager",
      role: "University research facility",
    },
    {
      quote:
        "Responsive support on imaging accessories and consumables; we trust them for critical care equipment.",
      author: "Clinical director",
      role: "Private clinic",
    },
  ],
};

export const DEFAULT_ABOUT_MARKETING: AboutMarketingContent = {
  metaTitle: "About us",
  metaDescription:
    "ByMed Medical & Scientific supplies world-class medical, scientific, and engineering solutions in Zimbabwe. Discover our vision, mission, ECG and imaging focus, university partnerships, and technical training.",
  ogTitle:
    "About ByMed — medical, scientific & engineering solutions in Zimbabwe",
  twitterTitle: "About ByMed Medical & Scientific",
  jsonLdName: "About ByMed Medical & Scientific",
  keywords: [
    "ByMed",
    "ByMed Medical and Scientific",
    "medical equipment Zimbabwe",
    "scientific equipment distributor",
    "engineering education Zimbabwe",
    "healthcare Zimbabwe",
    "laboratory equipment",
    "medical imaging Zimbabwe",
    "technical training medical equipment",
  ],
  headerEyebrow: "About us",
  headerTitle: "About ByMed Medical & Scientific",
  headerSubtitle:
    "If you need high-quality, professional medical or scientific products, you are in the right place.",
  overviewHeading: "Company overview",
  overviewParagraphs: [
    "ByMed Medical & Scientific is a dynamic, growth-driven company dedicated to delivering world-class medical, scientific, and engineering solutions across Africa. As a trusted importer and distributor, we supply high-quality medical equipment, consumables, point-of-care devices, laboratory tools, and digital imaging technologies to support critical care and minimally invasive procedures.",
    "We empower healthcare providers, universities, research institutions, and individuals with advanced equipment, technical training, and expert support. With a strong focus on innovation, quality, and education, ByMed is helping shape the future of healthcare, science, and technical excellence across the continent.",
  ],
  valueProps: [
    {
      title: "High quality",
      body: "Rigorous sourcing and dependable products.",
    },
    {
      title: "Industry experts",
      body: "Experienced team across clinical and technical domains.",
    },
    {
      title: "Customer centric",
      body: "Support tailored to hospitals, labs, and campuses.",
    },
  ],
  visionTitle: "Vision",
  visionText:
    "To be Zimbabwe's leading distributor of advanced medical devices, scientific research technologies, and engineering education solutions—empowering healthcare professionals, researchers, and students to drive progress and innovation.",
  missionTitle: "Mission",
  missionText:
    "Our mission is to provide cutting-edge technologies and expert training services that help transform healthcare, science, and engineering education across Zimbabwe.",
  aimsHeading: "We aim to",
  aims: [
    "Improve healthcare outcomes by bringing advanced ECG diagnostic technologies to Zimbabwe.",
    "Equip universities and research centres with state-of-the-art science and engineering equipment.",
    "Offer practical skills training to individuals and organisations so they can thrive in technical and scientific fields.",
  ],
  ctaTitle: "We would love to hear from you",
  ctaBody:
    "Whether you are interested in our ECG technologies, science and research equipment, or training services, our team is here to help.",
  ctaButtonLabel: "Contact us",
};

export const DEFAULT_SERVICES_MARKETING: ServicesMarketingContent = {
  metaTitle: "Medical equipment services",
  metaDescription:
    "Professional installation, training, repairs, and maintenance for hospital and laboratory equipment in Zimbabwe—autoclaves, X-ray, ultrasound, theatre, dental, and more. ByMed Medical & Scientific.",
  ogTitle: "Medical equipment services | ByMed Medical & Scientific",
  twitterTitle: "Medical equipment services",
  jsonLdName: "Medical equipment services",
  keywords: [
    "medical equipment repair Zimbabwe",
    "hospital equipment maintenance",
    "laboratory equipment service",
    "autoclave repair Zimbabwe",
    "X-ray machine service",
    "ultrasound repair",
    "theatre equipment maintenance",
    "dental equipment service",
    "medical equipment installation",
    "biomedical training Zimbabwe",
    "ByMed services",
  ],
  headerEyebrow: "Our services",
  headerTitle: "Professional services for reliable equipment performance",
  headerSubtitle:
    "From setup to upkeep—we support the equipment your patients and students depend on.",
  supportSectionTitle: "Comprehensive equipment support",
  supportSectionIntro:
    "End-to-end services so your teams can focus on care and research—not downtime.",
  supportPillars: [
    {
      title: "Installations",
      body: "Professional installation for new equipment so it is set up correctly and integrates with your existing systems.",
    },
    {
      title: "Training",
      body: "Expert training on the use and maintenance of hospital and laboratory equipment to maximise efficiency and safety.",
    },
    {
      title: "Repairs",
      body: "Comprehensive repair services for hospital and laboratory equipment to restore performance and extend service life.",
    },
    {
      title: "Maintenance",
      body: "Planned maintenance so your hospital and laboratory equipment stays in excellent condition.",
    },
  ],
  repairSectionTitle: "We repair the equipment you rely on",
  repairSectionIntro:
    "Reliable repair solutions for autoclaves, diagnostic imaging, surgical theatre tools, and dental equipment.",
  repairCategories: [
    {
      title: "Autoclaves",
      items: [
        "CSSD fixed autoclaves",
        "Tabletop dental and doctor's room autoclaves",
        "Vertical laboratory autoclaves",
        "Food industry autoclaves",
      ],
    },
    {
      title: "Imaging equipment",
      items: [
        "Digital X-ray machines (fixed and mobile)",
        "Analogue X-ray machines (fixed and mobile)",
        "Laser (DryView) film printers",
        "Ultrasound machines",
        "Dental X-ray machines",
      ],
    },
    {
      title: "Dental",
      items: ["Chairs", "Compressors"],
    },
    {
      title: "Theatre equipment",
      items: [
        "Theatre tables",
        "Defibrillators",
        "Endoscopy equipment",
        "ECG monitors and recorders",
      ],
    },
  ],
  restoreTitle: "Restore your equipment to like-new condition",
  restoreBody: [
    "Do not let faulty equipment disrupt your operations. Our technicians focus on precise, efficient repairs so you can return to peak performance.",
  ],
  restoreEmphasis: "Contact us today for a repair assessment.",
  ctaButtonLabel: "Contact us",
};

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

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function pickCta(value: unknown, fallback: CtaLink): CtaLink {
  if (!value || typeof value !== "object") return fallback;
  const o = value as Record<string, unknown>;
  const label = asString(o.label, fallback.label);
  const href = asString(o.href, fallback.href);
  return { label, href };
}

function pickHeroSlides(value: unknown): HomeHeroSlide[] {
  if (!Array.isArray(value)) return [];
  const out: HomeHeroSlide[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const tag = asString(o.tag, "");
    const title = asString(o.title, "");
    const subtitle = asString(o.subtitle, "");
    const imageSrcRaw = asString(o.imageSrc ?? o.image, "");
    const imageSrc = imageSrcRaw || undefined;
    if (tag && title && subtitle)
      out.push({ tag, title, subtitle, ...(imageSrc ? { imageSrc } : {}) });
  }
  return out;
}

function pickTestimonials(
  value: unknown,
  fallback: HomeTestimonial[],
): HomeTestimonial[] {
  if (!Array.isArray(value)) return fallback;
  const out: HomeTestimonial[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const quote = asString(o.quote, "");
    const author = asString(o.author, "");
    const role = asString(o.role, "");
    if (quote && author && role) out.push({ quote, author, role });
  }
  return out.length > 0 ? out : fallback;
}

function pickOfferings(
  value: unknown,
  fallback: HomeMarketingContent["offerings"],
): HomeMarketingContent["offerings"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: HomeMarketingContent["offerings"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title, "");
    const blurb = asString(o.blurb, "");
    if (title && blurb) out.push({ title, blurb });
  }
  return out.length > 0 ? out : fallback;
}

function pickDifferentiators(
  value: unknown,
  fallback: HomeMarketingContent["differentiators"],
): HomeMarketingContent["differentiators"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: HomeMarketingContent["differentiators"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title, "");
    const body = asString(o.body, "");
    if (title && body) out.push({ title, body });
  }
  return out.length > 0 ? out : fallback;
}

function pickValueProps(
  value: unknown,
  fallback: AboutMarketingContent["valueProps"],
): AboutMarketingContent["valueProps"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: AboutMarketingContent["valueProps"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title, "");
    const body = asString(o.body, "");
    if (title && body) out.push({ title, body });
  }
  return out.length > 0 ? out : fallback;
}

function pickRepairCategories(
  value: unknown,
  fallback: ServicesMarketingContent["repairCategories"],
): ServicesMarketingContent["repairCategories"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: ServicesMarketingContent["repairCategories"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title, "");
    const items = asStringArray(o.items);
    if (title && items.length > 0) out.push({ title, items });
  }
  return out.length > 0 ? out : fallback;
}

function pickSupportPillars(
  value: unknown,
  fallback: ServicesMarketingContent["supportPillars"],
): ServicesMarketingContent["supportPillars"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: ServicesMarketingContent["supportPillars"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title, "");
    const body = asString(o.body, "");
    if (title && body) out.push({ title, body });
  }
  return out.length > 0 ? out : fallback;
}

function pickKeywords(value: unknown, fallback: string[]): string[] {
  const arr = asStringArray(value);
  return arr.length > 0 ? arr : fallback;
}

/** Merge API JSON into defaults; unknown shape falls back safely. */
export function parseHomeMarketingContent(
  raw: string,
  defaults: HomeMarketingContent = DEFAULT_HOME_MARKETING,
): HomeMarketingContent {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      metaTitle: asString(p.metaTitle, defaults.metaTitle),
      metaDescription: asString(p.metaDescription, defaults.metaDescription),
      ogTitle: asString(p.ogTitle, defaults.ogTitle),
      keywords: pickKeywords(p.keywords, defaults.keywords),
      heroEyebrow: asString(p.heroEyebrow, defaults.heroEyebrow),
      heroTitle: asString(p.heroTitle, defaults.heroTitle),
      heroSubtitle: asString(p.heroSubtitle, defaults.heroSubtitle),
      heroSlides: (() => {
        const picked = pickHeroSlides(p.heroSlides);
        return picked.length > 0 ? picked : defaults.heroSlides;
      })(),
      primaryCta: pickCta(p.primaryCta, defaults.primaryCta),
      secondaryCta: pickCta(p.secondaryCta, defaults.secondaryCta),
      whatWeOfferHeading: asString(
        p.whatWeOfferHeading,
        defaults.whatWeOfferHeading,
      ),
      whatWeOfferIntro: asString(p.whatWeOfferIntro, defaults.whatWeOfferIntro),
      offerings: pickOfferings(p.offerings, defaults.offerings),
      catalogueLinkLabel: asString(
        p.catalogueLinkLabel,
        defaults.catalogueLinkLabel,
      ),
      brandsHeading: asString(p.brandsHeading, defaults.brandsHeading),
      brandsIntro: asString(p.brandsIntro, defaults.brandsIntro),
      brandsLinkLabel: asString(p.brandsLinkLabel, defaults.brandsLinkLabel),
      whyHeading: asString(p.whyHeading, defaults.whyHeading),
      whyLead: asString(p.whyLead, defaults.whyLead),
      whySub: asString(p.whySub, defaults.whySub),
      differentiators: pickDifferentiators(
        p.differentiators,
        defaults.differentiators,
      ),
      servicesLinkLabel: asString(
        p.servicesLinkLabel,
        defaults.servicesLinkLabel,
      ),
      contactHeading: asString(p.contactHeading, defaults.contactHeading),
      contactIntro: asString(p.contactIntro, defaults.contactIntro),
      contactCtaLabel: asString(p.contactCtaLabel, defaults.contactCtaLabel),
      testimonials: pickTestimonials(p.testimonials, defaults.testimonials),
    };
  } catch {
    return defaults;
  }
}

const DEFAULT_HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=80",
  "/images/tekno-operating.webp",
] as const;

/** Hero carousel: CMS `heroSlides` when present, else defaults + imagery per slide index. */
export function resolvedHeroSlides(data: HomeMarketingContent): HomeHeroSlide[] {
  if (data.heroSlides.length > 0) {
    return data.heroSlides.map((slide, i) => ({
      ...slide,
      imageSrc:
        slide.imageSrc ??
        DEFAULT_HERO_BACKGROUNDS[i % DEFAULT_HERO_BACKGROUNDS.length],
    }));
  }
  return [
    {
      tag: data.heroEyebrow,
      title: data.heroTitle,
      subtitle: data.heroSubtitle,
      imageSrc: DEFAULT_HERO_BACKGROUNDS[0],
    },
    {
      tag: "Technical teaching",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
      imageSrc: DEFAULT_HERO_BACKGROUNDS[1],
    },
    {
      tag: "Medical teaching",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
      imageSrc: DEFAULT_HERO_BACKGROUNDS[2],
    },
    {
      tag: "Industrial and lab scales",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
      imageSrc: DEFAULT_HERO_BACKGROUNDS[3],
    },
    {
      tag: "Hospital Equipment",
      title: "Details coming soon",
      subtitle: "We’re preparing messaging for this slide.",
      imageSrc: "/images/tekno-operating.webp",
    },
  ];
}

/**
 * Supports rich JSON (see DEFAULT_ABOUT_MARKETING keys) and legacy CMS shapes:
 * `companyOverview` / `overview`, `mission`, `services` (string arrays).
 */
export function parseAboutMarketingContent(
  raw: string,
  defaults: AboutMarketingContent = DEFAULT_ABOUT_MARKETING,
): AboutMarketingContent {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const legacyOverview = asStringArray(p.companyOverview ?? p.overview);
    const legacyMission = asStringArray(p.mission);
    const overviewParagraphs =
      asStringArray(p.overviewParagraphs).length > 0
        ? asStringArray(p.overviewParagraphs)
        : legacyOverview.length > 0
          ? legacyOverview
          : defaults.overviewParagraphs;
    const missionText =
      typeof p.missionText === "string" && p.missionText.trim()
        ? p.missionText.trim()
        : legacyMission.length > 0
          ? legacyMission.join("\n\n")
          : defaults.missionText;

    return {
      metaTitle: asString(p.metaTitle, defaults.metaTitle),
      metaDescription: asString(p.metaDescription, defaults.metaDescription),
      ogTitle: asString(p.ogTitle, defaults.ogTitle),
      twitterTitle: asString(p.twitterTitle, defaults.twitterTitle),
      jsonLdName: asString(p.jsonLdName, defaults.jsonLdName),
      keywords: pickKeywords(p.keywords, defaults.keywords),
      headerEyebrow: asString(p.headerEyebrow, defaults.headerEyebrow),
      headerTitle: asString(p.headerTitle, defaults.headerTitle),
      headerSubtitle: asString(p.headerSubtitle, defaults.headerSubtitle),
      overviewHeading: asString(p.overviewHeading, defaults.overviewHeading),
      overviewParagraphs,
      valueProps: pickValueProps(p.valueProps, defaults.valueProps),
      visionTitle: asString(p.visionTitle, defaults.visionTitle),
      visionText: asString(p.visionText, defaults.visionText),
      missionTitle: asString(p.missionTitle, defaults.missionTitle),
      missionText,
      aimsHeading: asString(p.aimsHeading, defaults.aimsHeading),
      aims:
        asStringArray(p.aims).length > 0
          ? asStringArray(p.aims)
          : defaults.aims,
      ctaTitle: asString(p.ctaTitle, defaults.ctaTitle),
      ctaBody: asString(p.ctaBody, defaults.ctaBody),
      ctaButtonLabel: asString(p.ctaButtonLabel, defaults.ctaButtonLabel),
    };
  } catch {
    const paragraphs = raw
      .split(/\r?\n\r?\n/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (paragraphs.length > 0) {
      return { ...defaults, overviewParagraphs: paragraphs };
    }
    return defaults;
  }
}

function legacyServicesPillars(p: Record<string, unknown>): ServicesMarketingContent["supportPillars"] | null {
  const intro = asStringArray(p.introduction ?? p.overview);
  const training = asStringArray(p.technicalTraining ?? p.training);
  const support = asStringArray(p.supportServices ?? p.support);
  const repairs = asStringArray(p.medicalEquipmentRepairs ?? p.repairs);
  const pillars: ServicesMarketingContent["supportPillars"] = [];
  if (intro.length)
    pillars.push({
      title: "Overview",
      body: intro.join(" "),
    });
  if (training.length)
    pillars.push({
      title: "Technical training",
      body: training.join(" "),
    });
  if (support.length)
    pillars.push({
      title: "Support services",
      body: support.join(" "),
    });
  if (repairs.length)
    pillars.push({
      title: "Medical equipment repairs",
      body: repairs.join(" "),
    });
  return pillars.length > 0 ? pillars : null;
}

/** Rich JSON or legacy `introduction` / `technicalTraining` / `supportServices` / `medicalEquipmentRepairs` arrays. */
export function parseServicesMarketingContent(
  raw: string,
  defaults: ServicesMarketingContent = DEFAULT_SERVICES_MARKETING,
): ServicesMarketingContent {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const fromJson = pickSupportPillars(p.supportPillars, []);
    const legacy = legacyServicesPillars(p);
    const supportPillars =
      fromJson.length > 0 ? fromJson : legacy ?? defaults.supportPillars;

    return {
      metaTitle: asString(p.metaTitle, defaults.metaTitle),
      metaDescription: asString(p.metaDescription, defaults.metaDescription),
      ogTitle: asString(p.ogTitle, defaults.ogTitle),
      twitterTitle: asString(p.twitterTitle, defaults.twitterTitle),
      jsonLdName: asString(p.jsonLdName, defaults.jsonLdName),
      keywords: pickKeywords(p.keywords, defaults.keywords),
      headerEyebrow: asString(p.headerEyebrow, defaults.headerEyebrow),
      headerTitle: asString(p.headerTitle, defaults.headerTitle),
      headerSubtitle: asString(p.headerSubtitle, defaults.headerSubtitle),
      supportSectionTitle: asString(
        p.supportSectionTitle,
        defaults.supportSectionTitle,
      ),
      supportSectionIntro: asString(
        p.supportSectionIntro,
        defaults.supportSectionIntro,
      ),
      supportPillars,
      repairSectionTitle: asString(
        p.repairSectionTitle,
        defaults.repairSectionTitle,
      ),
      repairSectionIntro: asString(
        p.repairSectionIntro,
        defaults.repairSectionIntro,
      ),
      repairCategories: pickRepairCategories(
        p.repairCategories,
        defaults.repairCategories,
      ),
      restoreTitle: asString(p.restoreTitle, defaults.restoreTitle),
      restoreBody:
        asStringArray(p.restoreBody).length > 0
          ? asStringArray(p.restoreBody)
          : defaults.restoreBody,
      restoreEmphasis: asString(p.restoreEmphasis, defaults.restoreEmphasis),
      ctaButtonLabel: asString(p.ctaButtonLabel, defaults.ctaButtonLabel),
    };
  } catch {
    const paragraphs = raw
      .split(/\r?\n\r?\n/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (paragraphs.length > 0) {
      return {
        ...defaults,
        supportSectionIntro: paragraphs[0] ?? defaults.supportSectionIntro,
        supportPillars: paragraphs.slice(1).map((body, i) => ({
          title: `Section ${i + 1}`,
          body,
        })),
      };
    }
    return defaults;
  }
}
