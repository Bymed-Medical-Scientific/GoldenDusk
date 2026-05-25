import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { CurrencyProvider } from "@/components/currency/currency-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { ThemeProvider } from "@/components/theme-provider";
import { buildSiteOrganizationJsonLd } from "@/lib/seo/organization-json-ld";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_KEYWORDS,
  SITE_GEO_REGION,
  SITE_LOCALE,
  SITE_NAME,
} from "@/lib/seo/site-seo";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./fontface.css";
import "./globals.css";

const siteBaseUrl = getSiteBaseUrl();
const defaultOgImage = siteBaseUrl
  ? new URL("/images/bymed-logo.webp", siteBaseUrl).toString()
  : "/images/bymed-logo.webp";

export const metadata: Metadata = {
  metadataBase: siteBaseUrl ? new URL(siteBaseUrl) : undefined,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: [...SITE_DEFAULT_KEYWORDS],
  alternates: siteBaseUrl ? { canonical: siteBaseUrl } : undefined,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [{ url: defaultOgImage, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "geo.region": SITE_GEO_REGION,
    "geo.placename": "Bulawayo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZW" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <JsonLdScript data={buildSiteOrganizationJsonLd()} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <CartProvider>
              <CurrencyProvider>
                <a href="#main-content" className="skip-to-main">
                  Skip to main content
                </a>
                <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
                  <SiteHeader />
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="relative z-0 flex min-w-0 flex-1 flex-col overflow-x-hidden scroll-mt-[4.5rem] pt-[4.5rem] outline-none sm:scroll-mt-20 sm:pt-20"
                  >
                    {children}
                  </main>
                  <SiteFooter />
                </div>
              </CurrencyProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
