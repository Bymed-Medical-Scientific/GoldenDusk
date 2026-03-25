const SHIMMER_SVG = `
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e5e7eb" offset="20%" />
      <stop stop-color="#f3f4f6" offset="50%" />
      <stop stop-color="#e5e7eb" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="16" height="16" fill="#e5e7eb" />
  <rect id="r" width="16" height="16" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-16" to="16" dur="1.2s" repeatCount="indefinite" />
</svg>
`.trim();

function toBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value).toString("base64");
  }
  return window.btoa(value);
}

export const BLUR_PLACEHOLDER_DATA_URL = `data:image/svg+xml;base64,${toBase64(
  SHIMMER_SVG,
)}`;
