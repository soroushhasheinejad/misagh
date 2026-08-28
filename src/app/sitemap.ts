import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

/**
 * نقشه سایت.
 *
 * چهار خانواده صفحه ایندکس می‌شوند:
 *   صفحه‌های ثابت | مقاله‌ها | صفحه هر قطعه | صفحه هر مدل خودرو و ترکیب دسته×خودرو
 *   | صفحه هر شماره فنی
 * آدرس‌های پارامتردار عمداً نمی‌آیند چون گوگل آن‌ها را تکراری می‌شمارد.
 */

const STATIC_PATHS = [
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();

  const [posts, parts, models, numbers] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.part.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 20_000,
    }),
    prisma.vehicleModel.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, make: { select: { slug: true } } },
    }),
    prisma.partNumber.findMany({
      where: { part: { isActive: true } },
      select: { normalized: true },
      take: 20_000,
    }),
  ]);

  // ترکیب دسته × خودرو، فقط جایی که واقعاً قطعه هست
  const modelCategoryPairs = await prisma.part.findMany({
    where: { isActive: true, fitments: { some: { generation: { isNot: null } } } },
    select: {
      category: { select: { slug: true } },
      fitments: {
        select: {
          generation: { select: { model: { select: { slug: true, make: { select: { slug: true } } } } } },
        },
        take: 1,
      },
    },
    take: 20_000,
  });

  const pairs = new Set<string>();
  for (const row of modelCategoryPairs) {
    const gen = row.fitments[0]?.generation;
    if (!gen || row.category.slug === "uncategorized") continue;
    pairs.add(`/car/${gen.model.make.slug}/${gen.model.slug}/${row.category.slug}`);
  }

  const url = (path: string) => `${base}${path}`;

  return [
    ...STATIC_PATHS.map((path) => ({ url: url(path), lastModified: new Date() })),

    ...models.map((m) => ({
      url: url(`/car/${m.make.slug}/${m.slug}`),
      lastModified: m.updatedAt,
    })),

    ...[...pairs].map((path) => ({ url: url(path), lastModified: new Date() })),

    ...parts.map((p) => ({
      url: url(`/part/${encodeURIComponent(p.slug)}`),
      lastModified: p.updatedAt,
    })),

    ...numbers.map((n) => ({
      url: url(`/oem/${encodeURIComponent(n.normalized)}`),
      lastModified: new Date(),
    })),

    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
    })),
  ];
}
