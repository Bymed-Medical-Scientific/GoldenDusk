import { CatalogueCatalog } from "@/components/catalogue/catalogue-catalog";
import { listCategories } from "@/lib/api/categories";
import {
  buildCatalogueHref,
  parseCatalogueQuery,
} from "@/lib/catalogue/catalogue-params";
import { catalogListingRobots } from "@/lib/seo/catalog-metadata";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type CategoryCataloguePageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  params,
  searchParams,
}: CategoryCataloguePageProps): Promise<Metadata> {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) {
    return { title: "Catalogue | Bymed Medical & Scientific" };
  }

  const { q } = parseCatalogueQuery(searchParams);
  const title = q
    ? `${category.name} — “${q}” | Bymed Medical & Scientific`
    : `${category.name} | Catalogue | Bymed Medical & Scientific`;
  const description = `Browse ${category.name} in our equipment catalogue. Request a quotation from Bymed Medical & Scientific.`;
  const canonical = absoluteUrl(
    buildCatalogueHref({ categorySlug: category.slug, q: undefined, brand: undefined }),
  );
  const robots = catalogListingRobots(searchParams);

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function CategoryCataloguePage({
  params,
  searchParams,
}: CategoryCataloguePageProps) {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const query = parseCatalogueQuery(searchParams);

  return (
    <CatalogueCatalog
      query={{ ...query, categoryId: category.id }}
      categorySlug={category.slug}
      categoryName={category.name}
    />
  );
}
