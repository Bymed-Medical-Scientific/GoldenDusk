import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Examples of how ByMed supports hospitals, laboratories, and education facilities with equipment and services.",
};

export default function CaseStudiesPage() {
  return (
    <div className="bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Case studies
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Outcomes from the field
          </h1>
          <p className="mt-4 text-muted-foreground">
            Detailed write-ups are prepared on request. Contact our team to
            discuss references relevant to imaging, theatre, laboratory, or
            education deployments.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
          >
            Request information
          </Link>
        </div>
      </header>
    </div>
  );
}
