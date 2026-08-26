import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

/**
 * نقشه سایت.
 *
 * فقط آدرس‌های قابل ایندکس اینجا می‌آیند: صفحه‌های ثابت، مقاله‌های منتشرشده و
 * صفحه هر قطعه. آدرس‌های پارامتردار مثل /catalog?categoryId=… عمداً حذف شده‌اند،
 * چون گوگل آن‌ها را نسخه تکراری همان صفحه کاتالوگ می‌شمارد و ارزش ایندکس ندارند.
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

  const [posts, parts] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.part.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      // سقف استاندارد هر فایل نقشه سایت ۵۰ هزار آدرس است
      take: 45_000,
    }),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    })),
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
    ...parts.map((part) => ({
      url: `${base}/part/${part.slug}`,
      lastModified: part.updatedAt,
    })),
  ];
}
