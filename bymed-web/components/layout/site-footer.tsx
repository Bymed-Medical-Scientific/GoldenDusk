import { BymedLogo } from "@/components/brand/bymed-logo";
import Link from "next/link";
import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import { footerQuickLinks } from "@/lib/site-nav";

const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BymedLogo variant="footer" />
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Healthcare, scientific research, and engineering education across
              Zimbabwe—trusted equipment, consumables, and training.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Quick links
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {footerQuickLinks.map(({ href, label }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Contact
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={siteFooterMailtoHref}
                  className="transition-colors hover:text-foreground"
                >
                  {siteFooterContact.email}
                </a>
              </li>
              <li>
                <a
                  href={siteFooterTelHref}
                  className="transition-colors hover:text-foreground"
                >
                  {siteFooterContact.phoneDisplay}
                </a>
              </li>
              <li>{siteFooterContact.hoursLine}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:text-left">
          © {year} ByMed. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
