import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Contact us";
const description =
  "Get in touch with Bymed Medical & Scientific for product questions, support, and procurement assistance.";
const canonical = absoluteUrl("/contact");

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical ? { canonical } : undefined,
  openGraph: {
    title: `${title} | Bymed Medical & Scientific`,
    description,
    type: "website",
    url: canonical,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
