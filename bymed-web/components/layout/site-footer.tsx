import { BymedLogo } from "@/components/brand/bymed-logo";
import {
  siteFooterContact,
  siteFooterMailtoHref,
  siteFooterTelHref,
} from "@/lib/site-contact";
import {
  footerExploreLinks,
  footerProductLinks,
  footerQuickLinks,
  footerServiceLinks,
} from "@/lib/site-nav";
import Link from "next/link";

const year = new Date().getFullYear();

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconTwitter({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.55a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative bg-muted text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BymedLogo variant="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Medical and scientific equipment, consumables, and support for
              healthcare, research, and education.
            </p>
            <ul className="mt-6 flex gap-3" aria-label="Social media">
              <li>
                <a
                  href="https://www.facebook.com/"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/60 transition hover:text-primary"
                  aria-label="Facebook"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <IconFacebook className="size-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/60 transition hover:text-primary"
                  aria-label="Twitter"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <IconTwitter className="size-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/60 transition hover:text-primary"
                  aria-label="LinkedIn"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <IconLinkedin className="size-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/60 transition hover:text-primary"
                  aria-label="Instagram"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <IconInstagram className="size-4" />
                </a>
              </li>
            </ul>
            <p className="mt-8 text-xs text-muted-foreground">
              © {year} ByMed Medical &amp; Scientific. All rights reserved.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Products
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {footerProductLinks.map(({ href, label }) => (
                <li key={label}>
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

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Services
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {footerServiceLinks.map(({ href, label }) => (
                <li key={label}>
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

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Quick links
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {footerExploreLinks.map(({ href, label }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {footerQuickLinks
                .filter((l) => l.href === "/account" || l.href === "/login")
                .map(({ href, label }) => (
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
            <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-foreground">
              Contact
            </h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
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

        <div className="mt-12 border-t border-border/60 pt-8">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground sm:justify-start"
            aria-label="Legal"
          >
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy policy
            </Link>
            <Link href="/compliance" className="hover:text-foreground">
              Compliance
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground">
              Terms of service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
