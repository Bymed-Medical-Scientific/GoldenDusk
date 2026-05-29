import { CatalogueCatalog } from "@/components/catalogue/catalogue-catalog";
import {
  buildCatalogueHref,
  parseCatalogueQuery,
} from "@/lib/catalogue/catalogue-params";
import { listCategories } from "@/lib/api/categories";
import { catalogListingRobots } from "@/lib/seo/catalog-metadata";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

type CataloguePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  searchParams,
}: CataloguePageProps): Promise<Metadata> {
  const { q } = parseCatalogueQuery(searchParams);
  const title = q
    ? `Catalogue — “${q}” | Bymed Medical & Scientific`
    : "Catalogue | Bymed Medical & Scientific";
  const description = q
    ? `Browse catalogue items matching “${q}” at Bymed Medical & Scientific.`
    : "Browse our medical and scientific equipment catalogue. Request a quotation for pricing.";
  const canonical = absoluteUrl(buildCatalogueHref({ q: undefined, brand: undefined }));
  const robots = catalogListingRobots(searchParams);
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const query = parseCatalogueQuery(searchParams);

  if (query.categoryId) {
    const categories = await listCategories();
    const category = categories.find((c) => c.id === query.categoryId);
    if (category) {
      redirect(
        buildCatalogueHref({
          categorySlug: category.slug,
          q: query.q,
          brand: query.brand,
          page: query.pageNumber > 1 ? query.pageNumber : undefined,
        }),
      );
    }
  }

  return <CatalogueCatalog query={query} />;
}
