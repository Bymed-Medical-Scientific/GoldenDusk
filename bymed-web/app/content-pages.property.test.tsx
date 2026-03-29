import CmsBySlugPage from "@/app/[slug]/page";
import ContactPage from "@/app/contact/page";
import HomePage from "@/app/page";
import { render } from "@testing-library/react";
import fc from "fast-check";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

jest.mock("@/lib/api/content", () => ({
  getPageBySlug: jest.fn(async (slug: string) => ({
    id: `${slug}-id`,
    slug,
    title: slug,
    content: "{}",
    metadata: {},
    isPublished: true,
    creationTime: new Date().toISOString(),
  })),
}));

jest.mock("@/lib/api/products", () => ({
  listProducts: jest.fn(async () => ({
    items: [],
    pageNumber: 1,
    pageSize: 4,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })),
}));

jest.mock("@/lib/site-url", () => ({
  absoluteUrl: jest.fn((path: string) => `https://bymed.example${path}`),
}));

// Feature: bymed-website, Property 29: HTML Semantic Structure
describe("Property 29: HTML semantic structure", () => {
  it("for representative content pages, semantic landmarks are present (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<"home" | "about" | "services" | "contact">(
          "home",
          "about",
          "services",
          "contact",
        ),
        async (pageName) => {
          const ui =
            pageName === "home"
              ? await HomePage()
              : pageName === "about"
                ? await CmsBySlugPage({ params: { slug: "about" } })
                : pageName === "services"
                  ? await CmsBySlugPage({ params: { slug: "services" } })
                  : <ContactPage />;
          const { container } = render(ui);

          expect(container.querySelector("h1")).not.toBeNull();

          if (pageName === "contact") {
            expect(container.querySelector("form")).not.toBeNull();
            expect(container.querySelector("address")).not.toBeNull();
            return;
          }

          expect(container.querySelector("header")).not.toBeNull();
          expect(container.querySelectorAll("section").length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
