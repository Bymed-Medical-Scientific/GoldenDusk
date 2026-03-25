import { CheckoutPageContent } from "@/components/checkout/checkout-page-content";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Checkout";
const description = "Complete shipping, contact details, and payment for your order.";
const canonical = absoluteUrl("/checkout");

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

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter shipping and contact details, confirm PayNow, then review before paying.
      </p>
      <div className="mt-8">
        <CheckoutPageContent />
      </div>
    </div>
  );
}
