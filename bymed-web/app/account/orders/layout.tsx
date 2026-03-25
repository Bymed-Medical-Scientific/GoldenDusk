import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Order history";
const description =
  "Review your recent orders, statuses, and totals on Bymed Medical & Scientific.";
const canonical = absoluteUrl("/account/orders");

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical ? { canonical } : undefined,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} | Bymed Medical & Scientific`,
    description,
    type: "website",
    url: canonical,
  },
};

export default function AccountOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
