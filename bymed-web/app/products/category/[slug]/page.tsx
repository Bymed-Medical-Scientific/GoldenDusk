import { listCategories } from "@/lib/api/categories";
import { buildProductsHref, parseCatalogQuery } from "@/lib/catalog/catalog-params";
import { notFound, redirect } from "next/navigation";

type CategoryProductsRedirectPageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function CategoryProductsRedirectPage({
  params,
  searchParams,
}: CategoryProductsRedirectPageProps) {
  const categories = await listCategories();
  const target = categories.find((category) => category.slug === params.slug);
  if (!target) {
    notFound();
  }

  const query = parseCatalogQuery(searchParams);

  redirect(
    buildProductsHref({
      q: query.q,
      brand: query.brand,
      clientType: query.clientType,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      categoryId: target.id,
      page: 1,
    }),
  );
}
