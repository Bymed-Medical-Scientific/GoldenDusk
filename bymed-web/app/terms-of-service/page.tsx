import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms governing use of ByMed storefront and services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of service
      </h1>
      <p className="mt-4 text-muted-foreground">
        Use of this website and purchase of goods or services is subject to
        agreed commercial terms, including warranties and delivery, as confirmed
        at the time of order. For a formal copy, contact our sales team.
      </p>
    </div>
  );
}
