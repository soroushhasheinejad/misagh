import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "میثاق یدک — قطعات یدکی کیا و هیوندا",
  description:
    "فروشگاه اینترنتی قطعات یدکی کیا و هیوندا. جستجو بر اساس خودرو، شماره فنی و شماره شاسی.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen flex flex-col">
        <header className="bg-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              میثاق<span className="text-accent-soft"> یدک</span>
            </Link>
            <nav className="hidden gap-5 text-sm text-white/80 md:flex">
              <Link href="/catalog" className="hover:text-white">
                کاتالوگ قطعات
              </Link>
              <Link href="/search?type=oem" className="hover:text-white">
                جستجوی شماره فنی
              </Link>
              <Link href="/inquiry" className="hover:text-white">
                استعلام قیمت
              </Link>
            </nav>
            <div className="mr-auto flex items-center gap-3 text-sm">
              <Link
                href="/admin"
                className="rounded border border-white/25 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                پنل مدیریت
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
            میثاق یدک — قطعات یدکی کیا و هیوندا. نسخه در حال توسعه.
          </div>
        </footer>
      </body>
    </html>
  );
}
