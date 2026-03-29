"use client";

import { BYMED_LOGO_ALT, BYMED_LOGO_PATH } from "@/lib/site-brand";
import Image from "next/image";

type BymedLogoProps = {
  /** `header`: on brand blue. `headerOnLight`: white/light navbar (no drop shadow). `footer`: page background. */
  variant: "header" | "headerOnLight" | "footer";
  className?: string;
  priority?: boolean;
};

/**
 * Official logo from `/public/images/bymed-logo.webp`, shown without CSS color filters
 * so the file’s real artwork (colors, transparency) is preserved.
 */
export function BymedLogo({
  variant,
  className = "",
  priority = false,
}: BymedLogoProps) {
  const base =
    "h-9 w-auto max-w-[min(100%,11rem)] object-contain object-left sm:h-10 sm:max-w-[13rem]";
  const headerCls = `${base} drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]`;
  const headerOnLightCls = base;

  const variantClass =
    variant === "header"
      ? headerCls
      : variant === "headerOnLight"
        ? headerOnLightCls
        : base;

  return (
    <Image
      src={BYMED_LOGO_PATH}
      alt={
        variant === "header" || variant === "headerOnLight" ? "" : BYMED_LOGO_ALT
      }
      width={260}
      height={72}
      priority={priority}
      sizes="(max-width: 640px) 160px, 220px"
      className={`${variantClass} ${className}`}
    />
  );
}
