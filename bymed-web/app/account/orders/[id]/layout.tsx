import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order details",
  description: "Track order items, shipping status, and payment information.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Order details | Bymed Medical & Scientific",
    description: "Track order items, shipping status, and payment information.",
    type: "website",
  },
};

export default function AccountOrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
