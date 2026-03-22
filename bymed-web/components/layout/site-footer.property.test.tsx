import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { SiteFooter } from "./site-footer";

// Feature: bymed-website, Property 39: Footer Contact Information
describe("Property 39: Footer contact information", () => {
  it("for any synthetic page id, the rendered footer contains company email and phone (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 256 }),
        (pageId) => {
          const { container } = render(
            <div data-testid="page-root" data-page-id={pageId}>
              <main>Page content: {pageId}</main>
              <SiteFooter />
            </div>,
          );

          const footer = container.querySelector("footer");
          expect(footer).not.toBeNull();

          const text = footer!.textContent ?? "";
          expect(text).toContain(siteFooterContact.email);
          expect(text).toContain(siteFooterContact.phoneDisplay);

          const mail = footer!.querySelector(`a[href="${siteFooterMailtoHref}"]`);
          const tel = footer!.querySelector(`a[href="${siteFooterTelHref}"]`);
          expect(mail).not.toBeNull();
          expect(tel).not.toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
