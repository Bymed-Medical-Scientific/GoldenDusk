import { sanitizeProductDescriptionHtml } from "@/lib/html/sanitize-product-description";

type ProductDescriptionProps = {
  html: string;
};

/**
 * Renders admin rich-text (HTML) with sanitization (XSS-safe subset).
 */
export function ProductDescription({ html }: ProductDescriptionProps) {
  const safe = sanitizeProductDescriptionHtml(html);
  if (!safe) {
    return null;
  }

  return (
    <div
      className="product-description mt-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_em]:italic [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_i]:italic [&_li]:ml-5 [&_ol]:my-3 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_b]:font-semibold"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
