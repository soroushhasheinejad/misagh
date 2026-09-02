import { prisma } from "@/lib/prisma";

/**
 * جدول ریدایرکت با کش در حافظه.
 *
 * proxy روی هر درخواست صفحه اجرا می‌شود، پس نمی‌شود هر بار به دیتابیس زد.
 * کل جدول — که چند صد ردیف بیشتر نمی‌شود — یک بار خوانده و در حافظه نگه
 * داشته می‌شود و هر دقیقه تازه می‌شود. بعد از ذخیره در پنل هم کش دستی
 * باطل می‌شود تا تغییر بلافاصله اثر کند.
 */

type Entry = { destination: string; permanent: boolean };

let cache: Map<string, Entry> | null = null;
let loadedAt = 0;
const TTL_MS = 60_000;

export function invalidateRedirectCache() {
  cache = null;
}

async function load(): Promise<Map<string, Entry>> {
  const rows = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { source: true, destination: true, permanent: true },
  });
  const map = new Map<string, Entry>();
  for (const row of rows) {
    map.set(normalizePath(row.source), {
      destination: row.destination,
      permanent: row.permanent,
    });
  }
  cache = map;
  loadedAt = Date.now();
  return map;
}

/** اسلش پایانی و حروف بزرگ نباید باعث شوند ریدایرکت پیدا نشود */
export function normalizePath(path: string): string {
  let out = decodeURIComponent(path.trim());
  if (!out.startsWith("/")) out = `/${out}`;
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out;
}

export async function lookupRedirect(pathname: string): Promise<Entry | null> {
  if (!cache || Date.now() - loadedAt > TTL_MS) {
    try {
      await load();
    } catch {
      // اگر دیتابیس در دسترس نبود، سایت نباید بخوابد
      return null;
    }
  }
  const found = cache?.get(normalizePath(pathname)) ?? null;
  if (found) void countHit(pathname);
  return found;
}

/** شمارش بازدید ریدایرکت — بدون معطل کردن پاسخ */
async function countHit(pathname: string) {
  try {
    await prisma.redirect.updateMany({
      where: { source: normalizePath(pathname) },
      data: { hits: { increment: 1 }, lastHitAt: new Date() },
    });
  } catch {
    // شمارش آماری است؛ خطایش نباید به کاربر برسد
  }
}
