type ProductJsonLdProps = {
  data: Record<string, unknown>;
};

export function ProductJsonLd({ data }: ProductJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Trusted: built from product DTO on the server only.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
