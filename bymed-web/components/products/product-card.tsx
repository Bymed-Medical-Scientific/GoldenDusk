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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
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
          <span className="absolute right-2 top-2 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-background">
            Out of stock
          </span>
        ) : (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-700/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            In stock
          </span>
        )}
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
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-lg font-semibold tabular-nums text-foreground">
            <FormattedPrice amount={product.price} currency={product.currency} />
          </p>
          <Link
            href={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
            aria-label={`View ${product.name}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6 4.5 3H3" />
              <circle cx="9" cy="20" r="1.25" />
              <circle cx="18" cy="20" r="1.25" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
