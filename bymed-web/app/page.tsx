import { PriceExamples } from "@/components/price/price-examples";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Medical and scientific equipment";
const description =
  "Shop reliable medical and scientific equipment, consumables, and supplies from Bymed Medical & Scientific.";
const canonical = absoluteUrl("/");

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

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Medical and scientific equipment
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Storefront foundation with light and dark themes aligned to the ByMed
          brand palette.
        </p>
        <PriceExamples />
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] transition-colors hover:bg-brand-hover"
          >
            Primary action
          </button>
          <button
            type="button"
            className="rounded-lg border border-border bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}
