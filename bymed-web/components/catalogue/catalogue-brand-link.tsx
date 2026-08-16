import Image from "next/image";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/ui/blur-placeholder";

type CatalogueBrandLinkProps = {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  className?: string;
};

export function CatalogueBrandLink({
  name,
  logoUrl,
  websiteUrl,
  className = "",
}: CatalogueBrandLinkProps) {
  const href = websiteUrl?.trim();
  if (!href) return null;

  const content = logoUrl?.trim() ? (
    <Image
      src={logoUrl.trim()}
      alt={`${name} — visit website`}
      width={160}
      height={48}
      className="h-10 w-auto max-w-[10rem] object-contain object-left"
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
    />
  ) : (
    <span className="text-sm font-semibold text-foreground underline-offset-2 group-hover:underline">
      {name}
    </span>
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      aria-label={`Visit ${name} website (opens in new tab)`}
    >
      {content}
    </a>
  );
}
