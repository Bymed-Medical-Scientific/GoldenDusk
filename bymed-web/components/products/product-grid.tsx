import type { ProductCardProduct } from "@/components/products/product-card";
import { ProductCard } from "@/components/products/product-card";

type ProductGridProps = {
  products: ProductCardProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
