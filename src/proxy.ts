import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * دروازه پنل مدیریت.
 *
 * روی همه مسیرهای /admin اجرا می‌شود — هم صفحه‌ها و هم اکشن‌های سرور، چون
 * اکشن‌ها هم به همان آدرس صفحه POST می‌شوند. بازدیدکننده بدون نشست معتبر
 * اصلاً به رندر صفحه نمی‌رسد.
 *
 * قرارداد middleware در نسخه ۱۶ نکست منسوخ شده و جایش proxy آمده است.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(token)) return NextResponse.next();

  // درخواست‌های اکشن سرور نباید به صفحه ورود ریدایرکت شوند
  if (request.method === "POST") {
    return new NextResponse("دسترسی ندارید", { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
