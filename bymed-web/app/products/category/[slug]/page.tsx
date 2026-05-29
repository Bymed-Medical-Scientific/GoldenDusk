import { ProductsCatalog } from "@/components/products/products-catalog";
import { listCategories } from "@/lib/api/categories";
import {
  buildProductsHref,
  parseCatalogQuery,
} from "@/lib/catalog/catalog-params";
import { catalogListingRobots } from "@/lib/seo/catalog-metadata";
import { buildSocialMetadata } from "@/lib/seo/social-metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type CategoryProductsPageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const categories = await listCategories();
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    return [];
  }
}

function categoryMetaDescription(categoryName: string): string {
  return `Shop ${categoryName} in Zimbabwe from ByMed Medical & Scientific—medical equipment suppliers with quotes, installation, training, and local support for hospitals, laboratories, and universities.`;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryProductsPageProps): Promise<Metadata> {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) {
    return { title: "Products | ByMed Medical & Scientific" };
  }

  const { q } = parseCatalogQuery(searchParams);
  const title = q
    ? `${category.name} — “${q}” | ByMed Medical & Scientific`
    : `${category.name} Equipment Zimbabwe | ByMed`;
  const description = q
    ? `Browse ${category.name} products matching “${q}” at ByMed Medical & Scientific.`
    : categoryMetaDescription(category.name);
  const canonicalPath = buildProductsHref({
    categorySlug: category.slug,
    q: undefined,
    brand: undefined,
    clientType: undefined,
  });
  const robots = catalogListingRobots(searchParams);

  return {
    title,
    description,
    keywords: [
      category.name,
      `${category.name} Zimbabwe`,
      "medical equipment Zimbabwe",
      "laboratory equipment Zimbabwe",
      "ByMed",
    ],
    robots,
    ...buildSocialMetadata({
      title,
      description,
      canonicalPath,
    }),
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
