import { OrderConfirmationPageContent } from "@/components/order-confirmation/order-confirmation-page-content";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const title = "Order confirmation";
const description =
  "View your Bymed Medical & Scientific order confirmation details and next steps.";
const canonical = absoluteUrl("/checkout/confirmation");

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical ? { canonical } : undefined,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} | Bymed Medical & Scientific`,
    description,
    type: "website",
    url: canonical,
  },
};

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams?: { orderId?: string };
}) {
  const orderId = (searchParams?.orderId ?? "").trim();
  return <OrderConfirmationPageContent orderId={orderId} />;
}
