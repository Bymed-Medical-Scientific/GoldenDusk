/** Primary storefront navigation (header + footer quick links). */
export const primaryNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/account", label: "My account" },
  { href: "/login", label: "Sign in" },
] as const;
