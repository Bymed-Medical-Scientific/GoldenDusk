import { SITE_DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/site-seo";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteBaseUrl();
  return {
    name: SITE_NAME,
    short_name: "ByMed",
    description: SITE_DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0000CC",
    lang: "en-ZW",
    icons: base
      ? [
          {
            src: new URL("/app/icon.svg", base).toString(),
            sizes: "any",
            type: "image/svg+xml",
          },
        ]
      : [{ src: "/app/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
