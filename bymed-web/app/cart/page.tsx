import { CartPageContent } from "@/components/cart/cart-page-content";

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
