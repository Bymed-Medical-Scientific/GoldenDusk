import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Reset password";
const description =
  "Request a secure password reset link for your Bymed Medical & Scientific account.";
const canonical = absoluteUrl("/reset-password");

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

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
