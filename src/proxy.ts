import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { lookupRedirect } from "@/lib/redirects";

/**
 * دو کار انجام می‌دهد: دروازه پنل مدیریت، و ریدایرکت آدرس‌های قدیمی.
 *
 * دروازه روی همه مسیرهای /admin اجرا می‌شود — هم صفحه‌ها و هم اکشن‌های سرور،
 * چون اکشن‌ها هم به همان آدرس صفحه POST می‌شوند. بازدیدکننده بدون نشست معتبر
 * اصلاً به رندر صفحه نمی‌رسد.
 *
 * ریدایرکت‌ها از دیتابیس می‌آیند و در حافظه کش می‌شوند. در نسخه ۱۶ نکست،
 * proxy روی رانتایم نود اجرا می‌شود، پس دسترسی به دیتابیس اینجا ممکن است —
 * در middleware قدیمی که روی edge بود این کار شدنی نبود.
 *
 * قرارداد middleware در نسخه ۱۶ منسوخ شده و جایش proxy آمده است.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------- ریدایرکت ----------------------------
  const isPrivate = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isPrivate) {
    const target = await lookupRedirect(pathname);
    if (target) {
      const url = new URL(target.destination, request.url);
      url.search = request.nextUrl.search;
      return NextResponse.redirect(url, target.permanent ? 308 : 307);
    }
    return NextResponse.next();
  }

  // ------------------------- دروازه پنل مدیریت -------------------------
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(token)) return NextResponse.next();

  // درخواست‌های اکشن سرور نباید به صفحه ورود ریدایرکت شوند
  if (request.method === "POST") {
    return new NextResponse("دسترسی ندارید", { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  // فایل‌های ثابت و مسیرهای داخلی نکست کنار گذاشته می‌شوند تا هر درخواست
  // تصویر و اسکریپت، یک جستجوی ریدایرکت راه نیندازد
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|fonts|.*\\.\\w+$).*)"],
};
