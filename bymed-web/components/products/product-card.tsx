"use client";

import { FormattedPrice } from "@/components/price/formatted-price";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import Image from "next/image";
import Link from "next/link";

export type ProductCardProduct = {
  id: string;
  name: string;
  imageUrl?: string;
  imageAlt: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  inventoryCount: number;
  categoryName: string;
};

type ProductCardProps = {
  product: ProductCardProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const inStock = product.isAvailable && product.inventoryCount > 0;
  const href = `/products/${product.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-muted"
        aria-describedby={`${product.id}-meta`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground"
            role="img"
            aria-label="No image"
          >
            No image
          </div>
        )}
        {!inStock ? (
          <span className="absolute left-2 top-2 rounded-md bg-foreground/85 px-2 py-0.5 text-xs font-medium text-background">
            Out of stock
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4" id={`${product.id}-meta`}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.categoryName}
        </p>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          <Link
            href={href}
            className="transition-colors hover:text-brand hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-auto text-lg font-semibold tabular-nums text-foreground">
          <FormattedPrice
            amount={product.price}
            currency={product.currency}
          />
        </p>
      </div>
    </article>
  );
}
