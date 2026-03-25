import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Create account";
const description =
  "Create a Bymed Medical & Scientific account to track orders, manage addresses, and speed up checkout.";
const canonical = absoluteUrl("/register");

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

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
