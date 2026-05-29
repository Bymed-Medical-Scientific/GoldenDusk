import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { CurrencyProvider } from "@/components/currency/currency-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FloatingWhatsAppButton } from "@/components/seo/floating-whatsapp-button";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { ThemeProvider } from "@/components/theme-provider";
import { buildSiteOrganizationJsonLd } from "@/lib/seo/organization-json-ld";
import { defaultOgImageUrl, buildSocialMetadata } from "@/lib/seo/social-metadata";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_KEYWORDS,
  SITE_DEFAULT_TITLE,
  SITE_GEO_REGION,
  SITE_NAME,
} from "@/lib/seo/site-seo";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./fontface.css";
import "./globals.css";

const siteBaseUrl = getSiteBaseUrl();
const rootSocial = buildSocialMetadata({
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
  image: defaultOgImageUrl(),
  canonicalPath: "/",
});

export const metadata: Metadata = {
  metadataBase: siteBaseUrl ? new URL(siteBaseUrl) : undefined,
  title: {
    default: SITE_DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: [...SITE_DEFAULT_KEYWORDS],
  applicationName: SITE_NAME,
  category: "Medical equipment supplier",
  ...rootSocial,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": SITE_GEO_REGION,
    "geo.placename": "Bulawayo, Harare, Zimbabwe",
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
                  <FloatingWhatsAppButton />
                </div>
              </CurrencyProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
