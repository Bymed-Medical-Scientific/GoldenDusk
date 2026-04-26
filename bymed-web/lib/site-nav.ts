/** Primary storefront navigation (header + footer quick links). */
export const primaryNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerProductLinks = [
  { href: "/products", label: "Medical Equipment" },
  { href: "/products", label: "Medical Teaching Equipment" },
  { href: "/products", label: "Technical Teaching Equipment" },
  { href: "/products", label: "Industrial & Lab Scales" },
  { href: "/products", label: "Point of Care" },
  { href: "/products", label: "Theatre & Surgical" },
  { href: "/products", label: "Hospital Equipment" },
  { href: "/products", label: "Instruments & Consumables" },
] as const;

export const footerServiceLinks = [
  { href: "/services", label: "Installation" },
  { href: "/services", label: "Training" },
  { href: "/services", label: "Maintenance & Repairs" },
  { href: "/contact", label: "Support" },
] as const;

export const footerExploreLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/account", label: "My account" },
  { href: "/login", label: "Sign in" },
] as const;
