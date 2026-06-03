import type { MetadataRoute } from "@/types/metadata";

export const runtime = "edge";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cv.agentbuff.id/";

  const routes = ["id", "en"];

  const sitemap: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0
  }));

  return sitemap;
}
