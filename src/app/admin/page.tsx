import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

const MODE_LABEL: Record<string, string> = {
  FIXED: "قیمت ثابت ریالی",
  CURRENCY_LINKED: "وابسته به نرخ ارز",
  INQUIRY: "فقط استعلام",
  HIDDEN: "بدون قیمت",
};

export default async function AdminHome() {
  const [parts, offers, generations, inquiries, zeroResults, settings, usd] = await Promise.all([
    prisma.part.count(),
    prisma.offer.count(),
    prisma.vehicleGeneration.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.searchLog.findMany({ where: { resultCount: 0 }, orderBy: { createdAt: "desc" }, take: 8 }),
    getSettings(),
    prisma.currency.findUnique({ where: { code: "USD" } }),
  ]);

  const cards = [
    { label: "قطعات", value: parts, href: "/admin/parts" },
    { label: "پیشنهاد فروش", value: offers, href: "/admin/parts" },
    { label: "نسل خودرو", value: generations, href: "/admin" },
    { label: "استعلام جدید", value: inquiries, href: "/admin" },
  ];

  return (
    <div>
      <div className="rule pb-6">
        <h1 className="font-display text-xl font-black">خلاصه فروشگاه</h1>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-surface p-5 transition-colors hover:bg-steel-2">
            <div className="tnum pt-2 font-display text-2xl font-black">
              {c.value.toLocaleString("fa-IR")}
            </div>
            <div className="text-xs text-muted">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 pt-8 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="rule pb-4">
            <h2 className="font-display text-base font-bold">قیمت‌گذاری</h2>
          </div>
          <dl className="text-sm">
            {[
              ["حالت پیش‌فرض", MODE_LABEL[String(settings["pricing.defaultMode"])] ?? "—"],
              ["حاشیه سود پیش‌فرض", `${settings["pricing.defaultMarginPercent"]}٪`],
              ["نرخ دلار", usd ? `${Number(usd.rateIrr).toLocaleString("fa-IR")} ریال` : "ثبت نشده"],
              ["چند پیشنهادی", settings["offers.multiOfferEnabled"] ? "روشن" : "خاموش"],
              ["استعلام قیمت", settings["inquiry.enabled"] ? "روشن" : "خاموش"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-line-2 py-2 last:border-b-0">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/admin/settings" className="btn btn-ghost mt-4 px-4 py-2 text-xs">
            تغییر تنظیمات
          </Link>
        </section>

        <section className="panel p-5">
          <div className="rule pb-4">
            <h2 className="font-display text-base font-bold">جستجوهای بی‌نتیجه</h2>
          </div>
          <p className="pb-3 text-xs text-muted">
            مشتری دنبال این کدها بوده و ما نداشتیم — فهرست خرید بعدی شما.
          </p>
          {zeroResults.length === 0 ? (
            <p className="text-sm text-faint">فعلاً موردی ثبت نشده است.</p>
          ) : (
            <ul>
              {zeroResults.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-b border-line-2 py-2 last:border-b-0"
                >
                  <span className="plate text-xs">{s.query}</span>
                  <span className="text-[0.7rem] text-faint">
                    {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(s.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
