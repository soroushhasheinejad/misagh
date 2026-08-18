import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "میثاق یدک — قطعات کیا و هیوندا",
  description:
    "قطعات یدکی کیا و هیوندا. جستجو بر اساس خودرو، شماره فنی و شماره شاسی، با موجودی و زمان تحویل مشخص.",
};

const NAV = [
  { href: "/catalog", label: "کاتالوگ" },
  { href: "/search", label: "شماره فنی" },
  { href: "/vin", label: "شماره شاسی" },
  { href: "/inquiry", label: "استعلام" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-brass/30 bg-carbon">
          <div className="mx-auto flex max-w-[1120px] items-center gap-8 px-5 py-4">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-display text-[1.35rem] font-black text-white">میثاق</span>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-brass">
                yadak
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="link-brass hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mr-auto flex items-center gap-3">
              <Link
                href="/admin"
                className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-brass"
              >
                admin
              </Link>
            </div>
          </div>
          {/* روی موبایل، مسیرها زیر لوگو می‌آیند */}
          <nav className="flex gap-5 overflow-x-auto border-t border-white/10 px-5 py-2.5 text-sm text-white/70 md:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-brass">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 bg-carbon text-white/60">
          <div className="mx-auto grid max-w-[1120px] gap-8 px-5 py-12 sm:grid-cols-3">
            <div>
              <div className="font-display text-lg font-black text-white">میثاق یدک</div>
              <p className="pt-2 text-sm leading-7">
                قطعات یدکی کیا و هیوندا، با شماره فنی مشخص و موجودی واقعی.
              </p>
            </div>
            <div>
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-brass">
                جستجو
              </div>
              <ul className="pt-3 text-sm">
                {NAV.map((item) => (
                  <li key={item.href} className="py-1">
                    <Link href={item.href} className="link-brass hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-brass">
                تماس
              </div>
              <p className="pt-3 text-sm leading-7">
                برای قطعات نایاب فرم استعلام را پر کنید؛ کارشناس ما قیمت و موجودی را اعلام می‌کند.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto max-w-[1120px] px-5 py-4 font-mono text-[0.68rem] tracking-[0.12em] text-white/35">
              MISAGH YADAK — KIA &amp; HYUNDAI PARTS
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
