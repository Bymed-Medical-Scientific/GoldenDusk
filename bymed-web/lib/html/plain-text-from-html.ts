/**
 * Strip tags and decode common entities for meta tags, JSON-LD, and previews.
 */
export function plainTextFromHtml(html: string): string {
  const stripped = html.replace(/<[^>]+>/g, " ");
  return decodeBasicEntities(stripped).replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(Number.parseInt(h, 16)),
    );
}
