import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliance",
  description: "Quality, regulatory alignment, and compliance at ByMed.",
};

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Compliance</h1>
      <p className="mt-4 text-muted-foreground">
        We work with recognised manufacturers and follow documented sourcing and
        service practices suitable for healthcare and laboratory environments.
        For vendor questionnaires, ISO-related documentation, or audit support,
        please reach out via our contact page.
      </p>
      <Link
        href="/contact"
        className="mt-8 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Contact compliance
      </Link>
    </div>
  );
}
