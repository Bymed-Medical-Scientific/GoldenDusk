"use client";

import type { GalleryImage } from "@/lib/catalog/product-gallery-images";
import { useId, useState } from "react";

type ProductImageGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const baseId = useId();
  const [index, setIndex] = useState(0);

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

  const main = images[index] ?? images[0];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs vary by deployment */}
        <img
          src={main.url}
          alt={main.alt}
          className="aspect-square w-full object-cover"
          width={960}
          height={960}
          sizes="(max-width: 1024px) 100vw, 50vw"
          fetchPriority="high"
        />
      </div>

      {images.length > 1 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gallery
          </p>
          <ul className="flex flex-wrap gap-2" aria-label={`${productName} images`}>
            {images.map((img, i) => {
              const selected = i === index;
              return (
                <li key={`${img.url}-${i}`}>
                  <button
                    type="button"
                    id={`${baseId}-thumb-${i}`}
                    aria-pressed={selected}
                    aria-label={`Show image ${i + 1} of ${images.length}`}
                    onClick={() => setIndex(i)}
                    className={`overflow-hidden rounded-lg border-2 transition-colors ${
                      selected
                        ? "border-brand ring-2 ring-ring ring-offset-2 ring-offset-background"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                      width={80}
                      height={80}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
