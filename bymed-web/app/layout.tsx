import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth/auth-context";
import { CartProvider } from "@/components/cart/cart-context";
import { CurrencyProvider } from "@/components/currency/currency-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
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
    <html lang="en" suppressHydrationWarning className={geistSans.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
                    className="flex flex-1 flex-col outline-none"
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
