import { listProducts } from "@/lib/api/products";
import fc from "fast-check";

jest.mock("@/lib/api/products", () => ({
  listProducts: jest.fn(),
}));

jest.mock("@/lib/site-url", () => ({
  getSiteBaseUrl: jest.fn(() => "https://bymed.example"),
}));

const listProductsMock = listProducts as jest.MockedFunction<typeof listProducts>;
const sitemap = require("@/app/sitemap").default as () => Promise<
  Array<{ url: string }>
>;

function paginate(ids: string[], pageSize: number): string[][] {
  if (ids.length === 0) return [[]];
  const pages: string[][] = [];
  for (let i = 0; i < ids.length; i += pageSize) {
    pages.push(ids.slice(i, i + pageSize));
  }
  return pages;
}

// Feature: bymed-website, Property 31: Sitemap Completeness
describe("Property 31: sitemap completeness", () => {
  beforeEach(() => {
    listProductsMock.mockReset();
  });

  it("for paginated products, sitemap includes all static and product URLs (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.uuid(), { maxLength: 260 }),
        async (productIds) => {
          const pageSize = 100;
          const pages = paginate(productIds, pageSize);
          const totalPages = pages.length;
          const totalCount = productIds.length;

          listProductsMock.mockImplementation(async (params) => {
            const pageNumber = params.pageNumber ?? 1;
            const pageItems = pages[pageNumber - 1] ?? [];

            return {
              items: pageItems.map((id) => ({
                id,
                name: `Product ${id}`,
                slug: `product-${id}`,
                description: "desc",
                categoryId: "cat-1",
                categoryName: "Category",
                price: 10,
                currency: "USD",
                inventoryCount: 10,
                lowStockThreshold: 2,
                isAvailable: true,
              })),
              pageNumber,
              pageSize,
              totalCount,
              totalPages,
              hasNextPage: pageNumber < totalPages,
              hasPreviousPage: pageNumber > 1,
            };
          });

          const entries = await sitemap();
          const urls = entries.map((entry) => entry.url);

          const staticUrls = [
            "https://bymed.example/",
            "https://bymed.example/products",
            "https://bymed.example/services",
            "https://bymed.example/about",
            "https://bymed.example/contact",
          ];

          for (const staticUrl of staticUrls) {
            expect(urls).toContain(staticUrl);
          }

          const productUrls = productIds.map(
            (id) => `https://bymed.example/products/${id}`,
          );

          for (const productUrl of productUrls) {
            expect(urls).toContain(productUrl);
          }

          expect(urls.length).toBe(staticUrls.length + productUrls.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
