import { headers } from "next/headers";

/**
 * آدرس پایه سایت.
 *
 * اگر NEXT_PUBLIC_SITE_URL تنظیم شده باشد همان ملاک است؛ وگرنه از هدر خود درخواست
 * ساخته می‌شود. بدون این fallback، اگر کسی هنگام استقرار متغیر را فراموش کند،
 * کل نقشه سایت و robots روی localhost منتشر می‌شود و بی‌فایده است.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";

  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
