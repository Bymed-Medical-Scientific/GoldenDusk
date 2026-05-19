import { ProductsCatalog } from "@/components/products/products-catalog";
import {
  buildProductsHref,
  parseCatalogQuery,
} from "@/lib/catalog/catalog-params";
import { listCategories } from "@/lib/api/categories";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

type ProductsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { q, brand, clientType } = parseCatalogQuery(searchParams);
  const title = q
    ? `Products — “${q}” | Bymed Medical & Scientific`
    : "Products | Bymed Medical & Scientific";
  const description = q
    ? `Browse products matching “${q}” at Bymed Medical & Scientific.`
    : "Browse medical and scientific equipment and supplies at Bymed Medical & Scientific.";
  const canonical = absoluteUrl(buildProductsHref({ q, brand, clientType }));
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = parseCatalogQuery(searchParams);

  if (query.categoryId) {
    const categories = await listCategories();
    const category = categories.find((c) => c.id === query.categoryId);
    if (category) {
      redirect(
        buildProductsHref({
          categorySlug: category.slug,
          q: query.q,
          brand: query.brand,
          clientType: query.clientType,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          page: query.pageNumber > 1 ? query.pageNumber : undefined,
        }),
      );
    }
  }

  return <ProductsCatalog query={query} />;
}
