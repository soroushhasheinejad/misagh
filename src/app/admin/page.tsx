import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export default async function AdminHome() {
  const [parts, offers, vehicles, inquiries, zeroResults, settings] = await Promise.all([
    prisma.part.count(),
    prisma.offer.count(),
    prisma.vehicleGeneration.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.searchLog.findMany({
      where: { resultCount: 0 },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getSettings(),
  ]);

  const cards = [
    { label: "قطعات ثبت‌شده", value: parts, href: "/admin/parts" },
    { label: "پیشنهادهای فروش", value: offers, href: "/admin/parts" },
    { label: "نسل‌های خودرو", value: vehicles, href: "/admin" },
    { label: "استعلام‌های جدید", value: inquiries, href: "/admin" },
  ];

  return (
    <div>
      <h1 className="text-lg font-bold">خلاصه فروشگاه</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-line bg-surface p-4 hover:border-accent"
          >
            <div className="text-xs text-muted">{c.label}</div>
            <div className="tnum pt-1 text-2xl font-bold">{c.value.toLocaleString("fa-IR")}</div>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-line bg-surface p-4">
        <h2 className="pb-2 text-sm font-bold">وضعیت فعلی قیمت‌گذاری</h2>
        <ul className="text-sm text-muted">
          <li className="py-0.5">
            حالت پیش‌فرض: <b className="text-ink">{String(settings["pricing.defaultMode"])}</b>
          </li>
          <li className="py-0.5">
            نمایش چند پیشنهاد:{" "}
            <b className="text-ink">{settings["offers.multiOfferEnabled"] ? "روشن" : "خاموش"}</b>
          </li>
          <li className="py-0.5">
            استعلام قیمت: <b className="text-ink">{settings["inquiry.enabled"] ? "روشن" : "خاموش"}</b>
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-4">
        <h2 className="pb-1 text-sm font-bold">جستجوهای بی‌نتیجه</h2>
        <p className="pb-3 text-xs text-muted">مشتری دنبال چه چیزی بوده که ما نداشتیم.</p>
        {zeroResults.length === 0 ? (
          <p className="text-sm text-faint">فعلاً موردی ثبت نشده است.</p>
        ) : (
          <ul className="text-sm">
            {zeroResults.map((s) => (
              <li key={s.id} className="border-t border-line py-1.5 first:border-t-0">
                <span className="pn">{s.query}</span>
                <span className="pr-2 text-xs text-faint">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(s.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
