import { QuoteCartPageContent } from "@/components/quote/quote-cart-page-content";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Quote cart";
const description =
  "Review items in your quote cart and submit a quotation request to Bymed Medical & Scientific.";
const canonical = absoluteUrl("/quote-cart");

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

export default function QuoteCartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Quote cart
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review items for your quotation request. Pricing will be confirmed by our team after
        submission.
      </p>
      <div className="mt-8">
        <QuoteCartPageContent />
      </div>
    </div>
  );
}
