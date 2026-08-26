import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // بخش‌هایی که نباید ایندکس شوند: پنل، ورود، سبد و پیگیری سفارش
      disallow: ["/admin", "/login", "/api", "/cart", "/order"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
