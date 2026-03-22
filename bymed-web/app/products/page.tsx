import { ProductPriceSamples } from "@/components/price/product-price-samples";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Products
      </h1>
      <p className="mt-2 text-muted-foreground">
        Product catalog will appear here. Sample rows below use your selected
        currency from the header.
      </p>
      <ProductPriceSamples />
    </div>
  );
}
