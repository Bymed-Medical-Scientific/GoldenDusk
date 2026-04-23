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
      className="product-description mt-3 min-w-0 max-w-full overflow-x-hidden text-sm leading-relaxed text-muted-foreground [overflow-wrap:break-word] [word-break:normal] [&_*]:max-w-full [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:break-words [&_div]:break-words [&_div]:whitespace-normal [&_em]:italic [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_i]:italic [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_li]:break-words [&_ol]:my-3 [&_ol]:list-decimal [&_p]:mb-3 [&_p]:break-words [&_p]:whitespace-normal [&_p:last-child]:mb-0 [&_span]:break-words [&_span]:whitespace-normal [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_strong]:font-semibold [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:whitespace-normal [&_td]:break-words [&_th]:break-words [&_ul]:my-3 [&_ul]:list-disc [&_video]:h-auto [&_video]:max-w-full [&_iframe]:max-w-full [&_b]:font-semibold"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
