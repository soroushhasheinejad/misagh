import Link from "next/link";

const NAV = [
  { href: "/admin", label: "خلاصه", hint: "overview" },
  { href: "/admin/settings", label: "تنظیمات فروشگاه", hint: "settings" },
  { href: "/admin/rates", label: "نرخ ارز", hint: "rates" },
  { href: "/admin/parts", label: "قطعات و قیمت", hint: "pricing" },
  { href: "/admin/inquiries", label: "استعلام‌ها", hint: "inquiries" },
  { href: "/admin/posts", label: "بلاگ", hint: "journal" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside>
          <div className="rule pb-4">
            <span className="rule-label">admin</span>
          </div>
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group border-b border-line-2 py-2.5 last:border-b-0"
              >
                <span className="font-display text-sm font-bold text-ink group-hover:text-brass-dark">
                  {item.label}
                </span>
                <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-faint">
                  {item.hint}
                </span>
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
