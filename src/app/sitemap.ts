import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, generations, parts] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.partCategory.findMany({ where: { isActive: true }, select: { id: true } }),
    prisma.vehicleGeneration.findMany({ where: { isActive: true }, select: { id: true } }),
    // صفحه هر قطعه — سنگین‌ترین بخش نقشه، پس فقط قطعات فعال
    prisma.part.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 20_000,
    }),
  ]);

  const staticPages = [
    "",
    "/catalog",
    "/search",
    "/vin",
    "/vehicles",
    "/blog",
    "/inquiry",
    "/about",
    "/contact",
    "/shipping",
    "/returns",
    "/faq",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...staticPages,
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...categories.map((c) => ({
      url: `${BASE}/catalog?categoryId=${c.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...generations.map((g) => ({
      url: `${BASE}/catalog?generationId=${g.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...parts.map((p) => ({
      url: `${BASE}/part/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
