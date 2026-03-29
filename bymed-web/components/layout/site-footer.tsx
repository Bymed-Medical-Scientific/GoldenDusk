import { BymedLogo } from "@/components/brand/bymed-logo";
import { Separator } from "@/components/ui/separator";
import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import { footerQuickLinks } from "@/lib/site-nav";
import { Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";

const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/80 bg-gradient-to-b from-muted/50 to-background dark:from-muted/20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <div>
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BymedLogo variant="footer" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Healthcare, scientific research, and engineering education across
              Zimbabwe—trusted equipment, consumables, and training.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Quick links
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {footerQuickLinks.map(({ href, label }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Contact
            </h2>
            <ul className="mt-5 flex flex-col gap-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Mail
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <a
                  href={siteFooterMailtoHref}
                  className="transition-colors hover:text-foreground"
                >
                  {siteFooterContact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <a
                  href={siteFooterTelHref}
                  className="transition-colors hover:text-foreground"
                >
                  {siteFooterContact.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{siteFooterContact.hoursLine}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>© {year} ByMed. All rights reserved.</p>
          <p className="max-w-md sm:text-right">
            ByMed Medical &amp; Scientific — medical, laboratory, and education
            solutions.
          </p>
        </div>
      </div>
    </footer>
  );
}
