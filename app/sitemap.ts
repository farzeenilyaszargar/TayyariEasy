import type { MetadataRoute } from "next";
import { getArticleResources, slugifyResourceTitle } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const routeDefs = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/tests", changeFrequency: "daily", priority: 0.95 },
    { path: "/problems", changeFrequency: "daily", priority: 0.92 },
    { path: "/resources", changeFrequency: "daily", priority: 0.9 },
    { path: "/leaderboards", changeFrequency: "daily", priority: 0.85 },
    { path: "/marketing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.25 },
    { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.25 }
  ] as const;

  const baseRoutes: MetadataRoute.Sitemap = routeDefs.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const articleRoutes: MetadataRoute.Sitemap = getArticleResources().map((article) => ({
    url: `${siteUrl}/resources/${slugifyResourceTitle(article.title)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9
  }));

  return [...baseRoutes, ...articleRoutes];
}
