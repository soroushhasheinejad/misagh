import type { Metadata } from "next";
import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "میثاق یدک — قطعات کیا و هیوندا",
    template: "%s | میثاق یدک",
  },
  description:
    "قطعات یدکی کیا و هیوندا. جستجو بر اساس خودرو، شماره فنی و شماره شاسی، با موجودی و زمان تحویل مشخص.",
};

const NAV = [
  { href: "/catalog", label: "کاتالوگ" },
  { href: "/vehicles", label: "خودروها" },
  { href: "/search", label: "شماره فنی" },
  { href: "/vin", label: "شماره شاسی" },
  { href: "/blog", label: "بلاگ" },
  { href: "/inquiry", label: "استعلام" },
];

const FOOTER = [
  {
    title: "خرید",
    links: [
      { href: "/catalog", label: "کاتالوگ قطعات" },
      { href: "/vehicles", label: "خودروهای تحت پوشش" },
      { href: "/search", label: "جستجوی شماره فنی" },
      { href: "/vin", label: "تشخیص با شماره شاسی" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { href: "/blog", label: "بلاگ فنی" },
      { href: "/faq", label: "سوالات متداول" },
      { href: "/shipping", label: "ارسال و پرداخت" },
      { href: "/returns", label: "ضمانت و مرجوعی" },
    ],
  },
  {
    title: "فروشگاه",
    links: [
      { href: "/about", label: "درباره ما" },
      { href: "/contact", label: "تماس با ما" },
      { href: "/inquiry", label: "استعلام قیمت" },
    ],
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-brass/30 bg-carbon">
          <div className="mx-auto flex max-w-[1120px] items-center gap-8 px-5 py-4">
            <Link href="/" className="flex shrink-0 items-baseline gap-1.5">
              <span className="font-display text-[1.4rem] font-black tracking-tight text-white">
                میثاق
              </span>
              <span className="font-display text-[1.4rem] font-black tracking-tight text-brass">
                یدک
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="link-brass hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/cart"
              className="mr-auto flex shrink-0 items-center gap-2 rounded border border-white/20 px-3 py-1.5 text-sm text-white/85 transition-colors hover:border-brass hover:text-white"
            >
              سبد خرید
              {cartCount > 0 ? (
                <span className="tnum rounded bg-brass px-1.5 text-xs font-bold text-white">
                  {cartCount.toLocaleString("fa-IR")}
                </span>
              ) : null}
            </Link>
          </div>
          {/* روی موبایل و تبلت، مسیرها زیر لوگو می‌آیند */}
          <nav className="flex gap-5 overflow-x-auto border-t border-white/10 px-5 py-2.5 text-sm text-white/70 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-brass">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 bg-carbon text-white/60">
          <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="font-display text-lg font-black text-white">میثاق یدک</div>
              <p className="pt-3 text-sm leading-7">
                قطعات یدکی کیا و هیوندا، با شماره فنی مشخص، سازگاری بررسی‌شده و موجودی واقعی.
              </p>
            </div>

            {FOOTER.map((col) => (
              <div key={col.title}>
                <div className="flex items-center gap-2">
                  <span className="size-[6px] rotate-45 bg-brass" />
                  <span className="font-display text-sm font-bold text-white">{col.title}</span>
                </div>
                <ul className="pt-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href} className="py-1">
                      <Link href={link.href} className="link-brass hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-4 text-[0.72rem] text-white/35">
              <span>میثاق یدک — قطعات یدکی کیا و هیوندا</span>
              <span className="tnum">{new Date().toLocaleDateString("fa-IR", { year: "numeric" })}</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
