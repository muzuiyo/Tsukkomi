import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tsukkomi.lain.today";
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.tsukkomi.lain.today";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/memos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const url = `${apiUrl}/memos?pageSize=100&visibility=public`;
    console.log("[sitemap] Fetching:", url);
    const res = await fetch(url);
    console.log("[sitemap] Response status:", res.status);
    const json = await res.json();
    console.log("[sitemap] Response keys:", Object.keys(json));

    if (json.success && Array.isArray(json.data)) {
      const memoPages: MetadataRoute.Sitemap = json.data.map(
        (memo: { id: string; createdAt: string }) => ({
          url: `${baseUrl}/memos/${memo.id}`,
          lastModified: new Date(memo.createdAt),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }),
      );

      return [...staticPages, ...memoPages];
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch memos:", err);
  }

  return staticPages;
}
