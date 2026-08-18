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
      parts.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers) })),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {generation ? (
        <div className="mb-5 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm">
          <span className="text-muted">خودروی انتخابی:</span>{" "}
          <span className="font-bold">
            {generation.model.make.nameFa} {generation.model.nameFa} {generation.nameFa}
          </span>{" "}
          <span className="tnum text-muted">
            ({generation.yearStart}
            {generation.yearEnd ? `–${generation.yearEnd}` : " به بعد"})
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <h2 className="pb-2 text-sm font-bold">دسته‌بندی</h2>
          <ul className="text-sm">
            {categories.map((c) => (
              <li key={c.id} className="py-1">
                <Link
                  href={`/catalog?${new URLSearchParams({ ...(generationId ? { generationId } : {}), categoryId: c.id })}`}
                  className={categoryId === c.id ? "font-bold text-accent" : "text-muted hover:text-accent"}
                >
                  {c.nameFa}
                </Link>
                <ul className="pr-3 pt-1">
                  {c.children.map((ch) => (
                    <li key={ch.id} className="py-0.5">
                      <Link
                        href={`/catalog?${new URLSearchParams({ ...(generationId ? { generationId } : {}), categoryId: ch.id })}`}
                        className={
                          categoryId === ch.id ? "font-bold text-accent" : "text-faint hover:text-accent"
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
          <h1 className="pb-4 text-lg font-bold">
            {results.length > 0 ? `${results.length} قطعه پیدا شد` : "قطعه‌ای پیدا نشد"}
          </h1>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map(({ part, offers }) => {
              const best = offers.find((o) => o.price.kind === "price");
              return (
                <article key={part.id} className="rounded-lg border border-line bg-surface p-4">
                  <Link href={`/part/${part.slug}`} className="font-medium hover:text-accent">
                    {part.nameFa}
                  </Link>
                  {"numbers" in part && part.numbers[0] ? (
                    <div className="pn pt-1 text-xs text-faint">{part.numbers[0].number}</div>
                  ) : null}
                  <div className="pt-3 text-sm">
                    {best && best.price.kind === "price" ? (
                      <span className="tnum font-bold">
                        {formatMoney(best.price.amountIrr, unit)}{" "}
                        <span className="text-xs font-normal text-muted">{moneyLabel(unit)}</span>
                      </span>
                    ) : (
                      <span className="text-signal">استعلام قیمت</span>
                    )}
                  </div>
                  {offers.length > 1 ? (
                    <div className="pt-1 text-xs text-faint">{offers.length} پیشنهاد</div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
