import sanitizeHtml from "sanitize-html";

/** Rich text from admin (Quill); keep semantic markup, drop scripts/styles. Uses sanitize-html (no jsdom — avoids Next RSC / ENOENT on default-stylesheet.css). */
export function sanitizeProductDescriptionHtml(html: string): string {
  return sanitizeHtml(html.trim(), {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
