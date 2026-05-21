import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/auth/forgot", "/api/", "/admin", "/settings"],
    },
    sitemap: "https://tsukkomi.lain.today/sitemap.xml",
  };
}
