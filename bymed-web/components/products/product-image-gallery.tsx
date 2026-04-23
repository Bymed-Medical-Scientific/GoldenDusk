"use client";

import type { GalleryImage } from "@/lib/catalog/product-gallery-images";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";
import Image from "next/image";

type ProductImageGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground"
        role="img"
        aria-label="No product image"
      >
        No image
      </div>
    );
  }

  const main = images[0];

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-xl border border-border bg-white">
      <Image
        src={main.url}
        alt={main.alt || productName}
        className="h-auto max-h-[70vh] w-full object-contain p-2 sm:max-h-[75vh] sm:p-3"
        width={960}
        height={960}
        sizes="(max-width: 1024px) 100vw, 50vw"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
        fetchPriority="high"
      />
    </div>
  );
}
