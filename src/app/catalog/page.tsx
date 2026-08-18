import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchByVehicle, priceOffers, getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ generationId?: string; trimId?: string; categoryId?: string }>;
}) {
  const { generationId, trimId, categoryId } = await searchParams;
  const settings = await getSettings();
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  const [categories, generation] = await Promise.all([
    getCategoryTree(),
    generationId
      ? prisma.vehicleGeneration.findUnique({
          where: { id: generationId },
          include: { model: { include: { make: true } } },
        })
      : null,
  ]);

  let results: Awaited<ReturnType<typeof searchByVehicle>> = [];

  if (generationId || trimId) {
    results = await searchByVehicle({ generationId, trimId, categoryId });
  } else if (categoryId) {
    const parts = await prisma.part.findMany({
      where: { categoryId, isActive: true },
      include: {
        offers: { where: { status: { not: "DISABLED" } }, include: { brand: true, supplier: true } },
        images: { take: 1 },
        numbers: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      take: 60,
    });
    results = await Promise.all(
      parts.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
    );
  }

  const keep = (id: string) =>
    `/catalog?${new URLSearchParams({ ...(generationId ? { generationId } : {}), categoryId: id })}`;

  return (
    <div>
      {/* نوار خودروی انتخابی — همیشه معلوم باشد فیلتر روی چیست */}
      {generation ? (
        <div className="border-b border-brass/25 bg-carbon text-white">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-brass">
                vehicle
              </span>
              <span className="font-display text-base font-bold">
                {generation.model.make.nameFa} {generation.model.nameFa} {generation.nameFa}
              </span>
              <span className="tnum text-sm text-white/50">
                {generation.yearStart}
                {generation.yearEnd ? ` – ${generation.yearEnd}` : " به بعد"}
              </span>
            </div>
            <Link href="/" className="text-xs text-white/50 link-brass hover:text-white">
              تغییر خودرو
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="grid gap-10 lg:grid-cols-[210px_1fr]">
          <aside>
            <div className="rule pb-4">
              <span className="rule-label">categories</span>
            </div>
            <ul className="text-sm">
              {categories.map((c) => (
                <li key={c.id} className="pb-3">
                  <Link
                    href={keep(c.id)}
                    className={
                      categoryId === c.id
                        ? "font-display font-bold text-brass-dark"
                        : "font-display font-bold hover:text-brass-dark"
                    }
                  >
                    {c.nameFa}
                  </Link>
                  <ul className="border-r border-line-2 pr-3 pt-1">
                    {c.children.map((ch) => (
                      <li key={ch.id} className="py-0.5">
                        <Link
                          href={keep(ch.id)}
                          className={
                            categoryId === ch.id ? "text-brass-dark" : "text-muted link-brass"
                          }
                        >
                          {ch.nameFa}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <div className="rule pb-6">
              <h1 className="font-display text-lg font-bold">
                {results.length > 0
                  ? `${results.length.toLocaleString("fa-IR")} قطعه`
                  : "قطعه‌ای پیدا نشد"}
              </h1>
              <span className="rule-label">results</span>
            </div>

            {results.length === 0 ? (
              <div className="panel p-8 text-center">
                <p className="text-sm text-muted">
                  {generation
                    ? "برای این خودرو در این دسته هنوز قطعه‌ای ثبت نشده است."
                    : "یک خودرو یا دسته‌بندی انتخاب کنید."}
                </p>
                <Link href="/inquiry" className="btn btn-brass mt-4">
                  درخواست قطعه
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map(({ part, offers }) => {
                  const best = offers.find((o) => o.price.kind === "price");
                  return (
                    <article
                      key={part.id}
                      className="panel flex flex-col p-5 transition-colors hover:border-brass"
                    >
                      <Link
                        href={`/part/${part.slug}`}
                        className="font-display text-[0.95rem] font-bold leading-7 hover:text-brass-dark"
                      >
                        {part.nameFa}
                      </Link>
                      {"numbers" in part && part.numbers[0] ? (
                        <div className="pt-3">
                          <span className="plate text-xs">{part.numbers[0].number}</span>
                        </div>
                      ) : null}
                      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                        <div>
                          {best && best.price.kind === "price" ? (
                            <div className="tnum font-display text-lg font-black">
                              {formatMoney(best.price.amountIrr, unit)}
                              <span className="pr-1 text-[0.7rem] font-medium text-muted">
                                {moneyLabel(unit)}
                              </span>
                            </div>
                          ) : (
                            <div className="font-display text-sm font-bold text-alert">
                              استعلام قیمت
                            </div>
                          )}
                          {offers.length > 1 ? (
                            <div className="pt-1 text-xs text-faint">
                              {offers.length} پیشنهاد فروش
                            </div>
                          ) : null}
                        </div>
                        <Link href={`/part/${part.slug}`} className="btn btn-ghost px-3 py-1.5 text-xs">
                          جزئیات
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
