import Link from "next/link";

const NAV = [
  { href: "/admin", label: "خلاصه" },
  { href: "/admin/settings", label: "تنظیمات فروشگاه" },
  { href: "/admin/rates", label: "نرخ ارز" },
  { href: "/admin/parts", label: "قطعات و قیمت" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <aside>
          <div className="pb-2 text-xs text-faint">پنل مدیریت</div>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-2 text-muted hover:bg-surface hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
