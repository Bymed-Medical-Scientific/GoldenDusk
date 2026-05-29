type CatalogueJsonLdProps = {
  data: Record<string, unknown>;
};

export function CatalogueJsonLd({ data }: CatalogueJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
