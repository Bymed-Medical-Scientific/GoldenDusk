import { CartPageContent } from "@/components/cart/cart-page-content";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Shopping cart";
const description =
  "Review items in your cart and continue to checkout on Bymed Medical & Scientific.";
const canonical = absoluteUrl("/cart");

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

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Shopping cart
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review your items, update quantities, and continue to checkout.
      </p>
      <div className="mt-8">
        <CartPageContent />
      </div>
    </div>
  );
}
