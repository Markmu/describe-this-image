import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/billing/"],
    },
    sitemap: "https://describethisimage.com/sitemap.xml",
  };
}

