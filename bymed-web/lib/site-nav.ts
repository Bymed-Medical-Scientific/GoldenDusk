/** Primary storefront navigation (header + footer quick links). */
export const primaryNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerProductLinks = [
  { href: "/products", label: "Diagnostic imaging" },
  { href: "/products", label: "Laboratory systems" },
  { href: "/products", label: "Patient monitoring" },
  { href: "/products", label: "Theatre & surgical" },
] as const;

export const footerServiceLinks = [
  { href: "/services", label: "Installation" },
  { href: "/services", label: "Training" },
  { href: "/services", label: "Maintenance" },
  { href: "/contact", label: "Repairs & support" },
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
