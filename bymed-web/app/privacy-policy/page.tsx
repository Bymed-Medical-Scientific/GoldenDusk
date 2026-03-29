import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How ByMed Medical & Scientific handles personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-4 text-muted-foreground">
        We process personal data only as needed to provide our services, fulfil
        orders, and respond to enquiries. For full policy text or data requests,
        please contact us through the details on our contact page.
      </p>
    </div>
  );
}
