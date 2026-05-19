import { ProductsCatalog } from "@/components/products/products-catalog";
import { listCategories } from "@/lib/api/categories";
import {
  buildProductsHref,
  parseCatalogQuery,
} from "@/lib/catalog/catalog-params";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type CategoryProductsPageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  params,
  searchParams,
}: CategoryProductsPageProps): Promise<Metadata> {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) {
    return { title: "Products | Bymed Medical & Scientific" };
  }

  const { q, brand, clientType } = parseCatalogQuery(searchParams);
  const title = q
    ? `${category.name} — “${q}” | Bymed Medical & Scientific`
    : `${category.name} | Bymed Medical & Scientific`;
  const description = q
    ? `Browse ${category.name} products matching “${q}” at Bymed Medical & Scientific.`
    : `Browse ${category.name} at Bymed Medical & Scientific.`;
  const canonical = absoluteUrl(
    buildProductsHref({ categorySlug: category.slug, q, brand, clientType }),
  );

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: CategoryProductsPageProps) {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) {
    notFound();
  }

  const query = parseCatalogQuery(searchParams);

  return (
    <ProductsCatalog
      query={{ ...query, categoryId: category.id }}
      categorySlug={category.slug}
      categoryName={category.name}
    />
  );
}
