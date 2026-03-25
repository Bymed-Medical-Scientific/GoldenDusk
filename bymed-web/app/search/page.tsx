import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search redirect",
  description: "Redirecting your search to the products catalog.",
  robots: { index: false, follow: false },
};

type SearchPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

/**
 * Header search submits to `/products`; this route keeps old `/search?q=` links working.
 */
export default function SearchPage({ searchParams }: SearchPageProps) {
  const raw = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  if (!raw) {
    redirect("/products");
  }
  redirect(`/products?q=${encodeURIComponent(raw)}`);
}
