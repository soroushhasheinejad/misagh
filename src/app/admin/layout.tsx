import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function logout() {
  "use server";
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

const NAV: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "کاتالوگ",
    links: [
      { href: "/admin", label: "خلاصه" },
      { href: "/admin/parts", label: "قطعات و قیمت" },
      { href: "/admin/catalog/vehicles", label: "خودروها" },
      { href: "/admin/catalog/taxonomy", label: "دسته و برند" },
      { href: "/admin/catalog/vin-rules", label: "شماره شاسی" },
    ],
  },
  {
    title: "سئو",
    links: [
      { href: "/admin/seo", label: "خلاصه سئو" },
      { href: "/admin/seo/pages", label: "صفحه‌ها" },
      { href: "/admin/seo/templates", label: "قالب‌ها" },
      { href: "/admin/seo/generate", label: "تولید گروهی" },
      { href: "/admin/seo/reports", label: "گزارش‌ها" },
      { href: "/admin/seo/redirects", label: "ریدایرکت‌ها" },
      { href: "/admin/seo/settings", label: "تنظیمات سئو" },
      { href: "/admin/posts", label: "بلاگ" },
    ],
  },
  {
    title: "فروش",
    links: [
      { href: "/admin/orders", label: "سفارش‌ها" },
      { href: "/admin/inquiries", label: "استعلام‌ها" },
      { href: "/admin/rates", label: "نرخ ارز" },
    ],
  },
  {
    title: "سیستم",
    links: [
      { href: "/admin/settings", label: "تنظیمات فروشگاه" },
      { href: "/admin/audit", label: "تاریخچه تغییرات" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside>
          <nav className="flex flex-col gap-6">
            {NAV.map((group) => (
              <div key={group.title}>
                <div className="flex items-center gap-2 pb-2">
                  <span className="size-[6px] rotate-45 bg-brass" />
                  <span className="font-display text-xs font-bold text-faint">{group.title}</span>
                </div>
                {group.links.map((item) => (
                  <Link key={item.href} href={item.href} className="group block py-1.5">
                    <span className="text-sm text-ink group-hover:text-brass-dark">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="flex flex-col gap-2 pt-6">
            <Link href="/" className="text-xs text-muted hover:text-brass-dark">
              دیدن سایت ←
            </Link>
            <form action={logout}>
              <button type="submit" className="text-xs text-muted hover:text-alert">
                خروج از پنل
              </button>
            </form>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
