import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { CurrencyProvider } from "@/components/currency/currency-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./fontface.css";
import "./globals.css";

const siteBaseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  metadataBase: siteBaseUrl ? new URL(siteBaseUrl) : undefined,
  title: {
    default: "Bymed Medical & Scientific",
    template: "%s | Bymed Medical & Scientific",
  },
  description:
    "Bymed Medical & Scientific supplies reliable medical and scientific equipment, consumables, and support services.",
  openGraph: {
    title: "Bymed Medical & Scientific",
    description:
      "Bymed Medical & Scientific supplies reliable medical and scientific equipment, consumables, and support services.",
    type: "website",
    siteName: "Bymed Medical & Scientific",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
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
                <div className="flex min-h-screen flex-col">
                  <SiteHeader />
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="relative z-0 flex flex-1 flex-col scroll-mt-[4.5rem] pt-[4.5rem] outline-none sm:scroll-mt-20 sm:pt-20"
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
