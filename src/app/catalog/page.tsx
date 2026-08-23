import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { searchParts, getCategoryTree, getUsedBrands, type PartSort } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, SortBar } from "@/components/ProductFilters";

export const metadata: Metadata = {
  title: "محصولات",
  description:
    "کاتالوگ کامل قطعات یدکی کیا و هیوندا با شماره فنی، موجودی و قیمت. فیلتر بر اساس خودرو، دسته و برند.",
};

type Params = {
  q?: string;
  categoryId?: string;
  brandId?: string;
  generationId?: string;
  trimId?: string;
  inStock?: string;
  hasPrice?: string;
  sort?: string;
  page?: string;
};

const SORTS: PartSort[] = ["newest", "name", "cheapest", "expensive"];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = (SORTS.includes(sp.sort as PartSort) ? sp.sort : "newest") as PartSort;

  const [settings, categories, brands, generation, category, brand] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    getUsedBrands(),
    sp.generationId
      ? prisma.vehicleGeneration.findUnique({
          where: { id: sp.generationId },
          include: { model: { include: { make: true } } },
        })
      : null,
    sp.categoryId ? prisma.partCategory.findUnique({ where: { id: sp.categoryId } }) : null,
    sp.brandId ? prisma.partBrand.findUnique({ where: { id: sp.brandId } }) : null,
  ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";

  const { items, total, pageCount } = await searchParts({
    q: sp.q,
    categoryId: sp.categoryId,
    generationId: sp.generationId,
    trimId: sp.trimId,
    brandId: sp.brandId,
    inStock: sp.inStock === "1",
    hasPrice: sp.hasPrice === "1",
    sort,
    page,
  });

  // آدرس صفحه بعد و قبل با حفظ همه فیلترها
  const hrefFor = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const base: Record<string, string | undefined> = { ...sp, ...overrides };
    for (const [key, value] of Object.entries(base)) {
      if (value) next.set(key, value);
    }
    return `/catalog${next.toString() ? `?${next}` : ""}`;
  };

  // برچسب فیلترهای فعال، هر کدام با امکان حذف
  const chips: Array<{ label: string; href: string }> = [];
  if (generation) {
    chips.push({
      label: `${generation.model.make.nameFa} ${generation.model.nameFa} ${generation.nameFa}`,
      href: hrefFor({ generationId: undefined, trimId: undefined, page: undefined }),
    });
  }
  if (category) chips.push({ label: category.nameFa, href: hrefFor({ categoryId: undefined, page: undefined }) });
  if (brand) chips.push({ label: brand.nameFa, href: hrefFor({ brandId: undefined, page: undefined }) });
  if (sp.q) chips.push({ label: `«${sp.q}»`, href: hrefFor({ q: undefined, page: undefined }) });
  if (sp.inStock === "1") chips.push({ label: "موجود", href: hrefFor({ inStock: undefined, page: undefined }) });
  if (sp.hasPrice === "1")
    chips.push({ label: "دارای قیمت", href: hrefFor({ hasPrice: undefined, page: undefined }) });

  return (
    <div>
      {/* سربرگ: اگر خودرو انتخاب شده، همان تیتر صفحه است */}
      <section className="border-b border-brass/25 bg-carbon py-10 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-brass">
            {generation ? "vehicle" : "catalog"}
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 pt-4">
            <h1 className="font-display text-2xl font-black">
              {generation
                ? `قطعات ${generation.model.make.nameFa} ${generation.model.nameFa} ${generation.nameFa}`
                : "محصولات"}
            </h1>
            {generation ? (
              <span className="tnum text-sm text-white/50">
                {generation.yearStart}
                {generation.yearEnd ? ` – ${generation.yearEnd}` : " به بعد"}
              </span>
            ) : (
              <span className="text-sm text-white/50">
                {total.toLocaleString("fa-IR")} قطعه کیا و هیوندا
              </span>
            )}
          </div>

          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-5">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex items-center gap-2 rounded border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-brass hover:text-white"
                >
                  {chip.label}
                  <span className="font-mono text-brass">×</span>
                </Link>
              ))}
              <Link href="/catalog" className="text-xs text-white/40 hover:text-brass">
                حذف همه فیلترها
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside>
            <Suspense fallback={<div className="h-64 animate-pulse rounded bg-line" />}>
              <ProductFilters
                categories={categories.map((c) => ({
                  id: c.id,
                  nameFa: c.nameFa,
                  children: c.children.map((ch) => ({ id: ch.id, nameFa: ch.nameFa })),
                }))}
                brands={brands.map((b) => ({ id: b.id, nameFa: b.nameFa }))}
              />
            </Suspense>
          </aside>

          <div>
            <Suspense fallback={<div className="h-8 animate-pulse rounded bg-line" />}>
              <SortBar total={total} />
            </Suspense>

            {items.length === 0 ? (
              <div className="panel p-10 text-center">
                <p className="text-muted">
                  با این فیلترها قطعه‌ای پیدا نشد. فیلترها را کم کنید یا درخواست قطعه ثبت کنید.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-5">
                  <Link href="/catalog" className="btn btn-ghost">
                    حذف فیلترها
                  </Link>
                  <Link href="/inquiry" className="btn btn-brass">
                    درخواست قطعه
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map(({ part, offers }) => (
                  <ProductCard key={part.id} part={part} offers={offers} unit={unit} />
                ))}
              </div>
            )}

            {pageCount > 1 ? (
              <nav className="flex items-center justify-between gap-3 pt-10" aria-label="صفحه‌بندی">
                {page > 1 ? (
                  <Link
                    href={hrefFor({ page: String(page - 1) })}
                    className="btn btn-ghost px-4 py-2 text-xs"
                  >
                    صفحه قبل
                  </Link>
                ) : (
                  <span />
                )}
                <span className="tnum font-mono text-xs text-faint">
                  {page} / {pageCount}
                </span>
                {page < pageCount ? (
                  <Link
                    href={hrefFor({ page: String(page + 1) })}
                    className="btn btn-ghost px-4 py-2 text-xs"
                  >
                    صفحه بعد
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
