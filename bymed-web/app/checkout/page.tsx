import { CheckoutPageContent } from "@/components/checkout/checkout-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Shipping, contact, and payment",
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
