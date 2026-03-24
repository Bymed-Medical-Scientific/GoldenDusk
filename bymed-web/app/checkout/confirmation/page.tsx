import { OrderConfirmationPageContent } from "@/components/order-confirmation/order-confirmation-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "View order confirmation details",
};

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams?: { orderId?: string };
}) {
  const orderId = (searchParams?.orderId ?? "").trim();
  return <OrderConfirmationPageContent orderId={orderId} />;
}
