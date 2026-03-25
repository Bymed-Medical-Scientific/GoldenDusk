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
    title: slug === "about" ? "About ByMed" : "Services",
    content: JSON.stringify({
      introduction: ["Intro"],
      overview: ["Overview"],
      mission: ["Mission"],
      technicalTraining: ["Training"],
      supportServices: ["Support"],
      medicalEquipmentRepairs: ["Repairs"],
      services: ["Service"],
    }),
    metadata: {},
    isPublished: true,
    creationTime: new Date().toISOString(),
  })),
}));

const AboutPage = require("@/app/about/page").default as () => Promise<JSX.Element>;
const ServicesPage = require("@/app/services/page").default as () => Promise<JSX.Element>;
const ContactPage = require("@/app/contact/page").default as () => JSX.Element;

// Feature: bymed-website, Property 29: HTML Semantic Structure
describe("Property 29: HTML semantic structure", () => {
  it("for representative content pages, semantic landmarks are present (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<"about" | "services" | "contact">(
          "about",
          "services",
          "contact",
        ),
        async (pageName) => {
          const ui =
            pageName === "about"
              ? await AboutPage()
              : pageName === "services"
                ? await ServicesPage()
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
