"use client";

import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import { catalogueDetailPath } from "@/lib/catalogue/catalogue-path";
import Image from "next/image";
import Link from "next/link";

export type CatalogueCardItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  imageAlt: string;
  categoryName: string;
};

type CatalogueCardProps = {
  item: CatalogueCardItem;
};

export function CatalogueCard({ item }: CatalogueCardProps) {
  const href = catalogueDetailPath(item);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-describedby={`${item.id}-meta`}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
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
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4" id={`${item.id}-meta`}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {item.categoryName}
        </p>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          <Link
            href={href}
            className="transition-colors hover:text-brand hover:underline"
          >
            {item.name}
          </Link>
        </h2>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Request a quote</p>
          <Link
            href={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
            aria-label={`View ${item.name}`}
          >
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
