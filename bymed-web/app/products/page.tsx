import { ProductsCatalog } from "@/components/products/products-catalog";

import {

  buildProductsHref,

  parseCatalogQuery,

} from "@/lib/catalog/catalog-params";

import { listCategories } from "@/lib/api/categories";

import { catalogListingRobots } from "@/lib/seo/catalog-metadata";

import { buildSocialMetadata } from "@/lib/seo/social-metadata";

import type { Metadata } from "next";

import { redirect } from "next/navigation";



type ProductsPageProps = {

  searchParams: Record<string, string | string[] | undefined>;

};



const CATALOG_TITLE =

  "Medical & Laboratory Equipment Catalogue Zimbabwe | ByMed";

const CATALOG_DESCRIPTION =

  "Browse medical equipment, laboratory equipment, hospital supplies, imaging, theatre, ICU, and teaching systems from a trusted supplier in Zimbabwe. Request quotes for hospitals, clinics, and universities.";



export async function generateMetadata({

  searchParams,

}: ProductsPageProps): Promise<Metadata> {

  const { q } = parseCatalogQuery(searchParams);

  const title = q

    ? `Products — “${q}” | ByMed Medical & Scientific`

    : CATALOG_TITLE;

  const description = q

    ? `Browse products matching “${q}” at ByMed Medical & Scientific — medical and laboratory equipment suppliers in Zimbabwe.`

    : CATALOG_DESCRIPTION;

  const canonicalPath = buildProductsHref({

    q: undefined,

    brand: undefined,

    clientType: undefined,

  });

  const robots = catalogListingRobots(searchParams);



  return {

    title,

    description,

    keywords: [

      "medical equipment catalogue Zimbabwe",

      "laboratory equipment Zimbabwe",

      "hospital equipment supplier",

      "ByMed products",

    ],

    robots,

    ...buildSocialMetadata({

      title,

      description,

      canonicalPath,

    }),

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

