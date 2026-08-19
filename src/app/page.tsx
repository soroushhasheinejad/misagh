import Link from "next/link";
import { getMakes, getCategoryTree, priceOffers } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { SearchPanel } from "@/components/SearchPanel";

export default async function HomePage() {
  const [makes, categories, settings, latest] = await Promise.all([
    getMakes(),
    getCategoryTree(),
    getSettings(),
    prisma.part.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        category: true,
        numbers: { where: { isPrimary: true }, take: 1 },
        offers: { where: { status: { not: "DISABLED" } }, include: { brand: true, supplier: true } },
      },
    }),
  ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const priced = await Promise.all(
    latest.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );

  return (
    <div>
      {/* ---------------- سربرگ: کاپوت بسته ---------------- */}
      <section className="relative overflow-hidden bg-carbon pb-28 pt-14 text-white">
        <div className="relative mx-auto max-w-[1120px] px-5">
          <div className="rise rise-1 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-brass">
            kia &amp; hyundai
          </div>
          <h1 className="rise rise-1 max-w-2xl pt-4 font-display text-3xl font-black leading-[1.5] sm:text-[2.6rem]">
            قطعه‌ای که به خودروی شما می‌خورد، نه چیزی شبیه آن
          </h1>
          <p className="rise rise-2 max-w-xl pt-4 text-white/65">
            خودرویتان را انتخاب کنید یا شماره فنی را وارد کنید. موجودی، زمان تحویل و کدهای معادل را
            پیش از خرید می‌بینید.
          </p>

          <div className="rise rise-2 flex flex-wrap items-center gap-3 pt-7">
            <span className="text-xs text-white/45">مثلاً همین کد را امتحان کنید</span>
            <Link href="/search?q=58101-D3A00" className="plate plate-dark plate-lg">
              58101-D3A00
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- کنسول جستجو ---------------- */}
      <div className="mx-auto -mt-20 max-w-[1120px] px-5">
        <div className="rise rise-3">
          <SearchPanel makes={makes.map((m) => ({ id: m.id, nameFa: m.nameFa }))} />
        </div>
      </div>

      {/* ---------------- دسته‌بندی ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-16">
        <div className="rule pb-6">
          <h2 className="font-display text-lg font-bold">دسته‌بندی قطعات</h2>
          <span className="rule-label">catalog</span>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-surface p-5 transition-colors hover:bg-steel-2">
              <Link
                href={`/catalog?categoryId=${c.id}`}
                className="font-display text-base font-bold hover:text-brass-dark"
              >
                {c.nameFa}
              </Link>
              <ul className="pt-2 text-sm text-muted">
                {c.children.slice(0, 4).map((ch) => (
                  <li key={ch.id} className="py-0.5">
                    <Link href={`/catalog?categoryId=${ch.id}`} className="link-brass">
                      {ch.nameFa}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- قطعات اخیر ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-16">
        <div className="rule pb-6">
          <h2 className="font-display text-lg font-bold">تازه‌ترین قطعات</h2>
          <span className="rule-label">recent</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {priced.map(({ part, offers }) => {
            const best = offers.find((o) => o.price.kind === "price");
            return (
              <article key={part.id} className="panel flex flex-col p-5 transition-colors hover:border-brass">
                <div className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-faint">
                  {part.category.nameFa}
                </div>
                <Link
                  href={`/part/${part.slug}`}
                  className="pt-2 font-display text-[0.95rem] font-bold leading-7 hover:text-brass-dark"
                >
                  {part.nameFa}
                </Link>
                {part.numbers[0] ? (
                  <div className="pt-3">
                    <span className="plate text-xs">{part.numbers[0].number}</span>
                  </div>
                ) : null}
                <div className="mt-auto pt-4">
                  {best && best.price.kind === "price" ? (
                    <div className="tnum font-display text-lg font-black">
                      {formatMoney(best.price.amountIrr, unit)}
                      <span className="pr-1 text-xs font-medium text-muted">{moneyLabel(unit)}</span>
                    </div>
                  ) : (
                    <div className="font-display text-sm font-bold text-alert">استعلام قیمت</div>
                  )}
                  {offers.length > 1 ? (
                    <div className="pt-1 text-xs text-faint">{offers.length} پیشنهاد فروش</div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
