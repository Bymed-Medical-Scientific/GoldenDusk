import fc from "fast-check";
import { getPageBySlug } from "@/lib/api/content";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

jest.mock("@/lib/api/content", () => ({
  getPageBySlug: jest.fn(),
}));

jest.mock("@/lib/site-url", () => ({
  absoluteUrl: jest.fn((path: string) => `https://bymed.example${path}`),
}));

const getPageBySlugMock = getPageBySlug as jest.MockedFunction<typeof getPageBySlug>;

const generateHomeMetadata = require("@/app/page").generateMetadata as () => Promise<{
  title?: unknown;
  description?: unknown;
  openGraph?: { title?: unknown; description?: unknown };
}>;
const generateAboutMetadata = require("@/app/about/page").generateMetadata as () => Promise<{
  title?: unknown;
  description?: unknown;
  openGraph?: { title?: unknown; description?: unknown };
}>;
const generateServicesMetadata = require("@/app/services/page")
  .generateMetadata as () => Promise<{
  title?: unknown;
  description?: unknown;
  openGraph?: { title?: unknown; description?: unknown };
}>;

function asNonEmptyString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "";
}

// Feature: bymed-website, Property 30: Page Metadata Completeness
describe("Property 30: Page metadata completeness", () => {
  beforeEach(() => {
    getPageBySlugMock.mockReset();
  });

  it("for home, about, and services generated metadata, title/description/openGraph are always present (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<"home" | "about" | "services">(
          "home",
          "about",
          "services",
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        fc.option(fc.webUrl(), { nil: undefined }),
        async (slug, metaTitle, metaDescription, ogImage) => {
          getPageBySlugMock.mockResolvedValueOnce({
            id: `${slug}-id`,
            slug,
            title: slug,
            content: "{}",
            metadata: {
              metaTitle,
              metaDescription,
              ogImage,
            },
            isPublished: true,
            creationTime: new Date().toISOString(),
          });

          const metadata =
            slug === "home"
              ? await generateHomeMetadata()
              : slug === "about"
                ? await generateAboutMetadata()
                : await generateServicesMetadata();

          const title =
            typeof metadata.title === "string"
              ? metadata.title
              : asNonEmptyString(metadata.openGraph?.title);
          const description = asNonEmptyString(metadata.description);
          const ogTitle = asNonEmptyString(metadata.openGraph?.title);
          const ogDescription = asNonEmptyString(metadata.openGraph?.description);

          expect(title.trim().length).toBeGreaterThan(0);
          expect(description.trim().length).toBeGreaterThan(0);
          expect(ogTitle.trim().length).toBeGreaterThan(0);
          expect(ogDescription.trim().length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
