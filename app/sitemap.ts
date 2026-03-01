import type { MetadataRoute } from "next";
import { getArticleResources, slugifyResourceTitle } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseRoutes: MetadataRoute.Sitemap = [
    "",
    "/marketing",
    "/home",
    "/tests",
    "/leaderboards",
    "/resources",
    "/problems",
    "/login",
    "/privacy-policy",
    "/terms-of-service"
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/resources" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8
  }));

  const articleRoutes: MetadataRoute.Sitemap = getArticleResources().map((article) => ({
    url: `${siteUrl}/resources/${slugifyResourceTitle(article.title)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9
  }));

  return [...baseRoutes, ...articleRoutes];
}
