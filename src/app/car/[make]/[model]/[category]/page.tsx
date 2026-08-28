import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getModelBySlug, getPartsForModel, getCategoriesForModel } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { faNumber, faYearRange } from "@/lib/format";
import { Breadcrumbs, breadcrumbSchema, JsonLd } from "@/components/Seo";

type Params = { make: string; model: string; category: string };

/**
 * صفحه ترکیب دسته و خودرو — «لنت ترمز کیا اسپورتیج».
 * این ترکیب دقیقاً همان چیزی است که مشتری در گوگل می‌نویسد و بیشترین
 * تعداد صفحه هدفمند را با داده موجود می‌سازد.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { make, model, category } = await params;
  const [found, cat] = await Promise.all([
    getModelBySlug(make, model),
    prisma.partCategory.findUnique({ where: { slug: category } }),
  ]);
  if (!found || !cat) return { title: "صفحه پیدا نشد" };

  const title = `${cat.nameFa} ${found.make.nameFa} ${found.nameFa}`;
  return {
    title,
    description: `خرید ${title} با شماره فنی سازنده؛ سازگاری بررسی‌شده، کدهای معادل و استعلام قیمت روز.`,
    alternates: { canonical: `/car/${make}/${model}/${category}` },
  };
}

export default async function CarCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { make, model, category } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [found, cat] = await Promise.all([
    getModelBySlug(make, model),
    prisma.partCategory.findUnique({ where: { slug: category } }),
  ]);
  if (!found || !cat) notFound();

  const [results, settings, siblings] = await Promise.all([
    getPartsForModel(found.id, { categoryId: cat.id, page }),
    getSettings(),
    getCategoriesForModel(found.id),
  ]);

  if (results.total === 0) notFound();

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const title = `${cat.nameFa} ${found.make.nameFa} ${found.nameFa}`;
  const years = found.generations.map((g) => faYearRange(g.yearStart, g.yearEnd));

  const crumbs = [
    { name: "خانه", url: "/" },
    { name: "خودروها", url: "/vehicles" },
    { name: `لوازم یدکی ${found.nameFa}`, url: `/car/${make}/${model}` },
    { name: cat.nameFa, url: `/car/${make}/${model}/${category}` },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <section className="border-b border-brass/25 bg-carbon py-10 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <Breadcrumbs items={crumbs.slice(0, -1)} />
          <h1 className="pt-4 font-display text-2xl font-black">{title}</h1>
          <p className="max-w-2xl pt-3 leading-8 text-white/60">
            {faNumber(results.total)} قطعه در دسته {cat.nameFa} برای {found.make.nameFa}{" "}
            {found.nameFa}، هر کدام با شماره فنی سازنده.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.items.map(({ part, offers }) => (
            <ProductCard key={part.id} part={part} offers={offers} unit={unit} />
          ))}
        </div>

        {results.pageCount > 1 ? (
          <nav className="flex items-center justify-between gap-3 pt-8">
            {page > 1 ? (
              <Link
                href={`/car/${make}/${model}/${category}${page > 2 ? `?page=${page - 1}` : ""}`}
                className="btn btn-ghost px-4 py-2 text-xs"
              >
                صفحه قبل
              </Link>
            ) : (
              <span />
            )}
            <span className="tnum text-xs text-faint">
              صفحه {faNumber(page)} از {faNumber(results.pageCount)}
            </span>
            {page < results.pageCount ? (
              <Link
                href={`/car/${make}/${model}/${category}?page=${page + 1}`}
                className="btn btn-ghost px-4 py-2 text-xs"
              >
                صفحه بعد
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        {/* دسته‌های دیگر همین خودرو — لینک‌سازی داخلی */}
        {siblings.length > 1 ? (
          <section className="pt-12">
            <div className="flex items-center gap-2.5 pb-4">
              <span className="size-[7px] rotate-45 bg-brass" />
              <h2 className="font-display text-base font-bold">
                دیگر قطعات {found.nameFa}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {siblings
                .filter((s) => s.category.id !== cat.id)
                .slice(0, 14)
                .map(({ category: sibling, count }) => (
                  <Link
                    key={sibling.id}
                    href={`/car/${make}/${model}/${sibling.slug}`}
                    className="panel px-4 py-2 text-sm transition-colors hover:border-brass"
                  >
                    {sibling.nameFa} {found.nameFa}
                    <span className="tnum pr-2 text-xs text-faint">{faNumber(count)}</span>
                  </Link>
                ))}
            </div>
          </section>
        ) : null}

        <section className="max-w-[68ch] pt-12">
          <div className="flex items-center gap-2.5 pb-4">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">درباره {title}</h2>
          </div>
          <p className="pb-4 leading-9 text-muted">
            {cat.nameFa} برای {found.make.nameFa} {found.nameFa}
            {years.length > 0 ? ` در نسل‌های ${years.join("، ")}` : ""} موجود است. پیش از
            خرید، نسل و تیپ خودرو را مشخص کنید؛ قطعات این دسته بین نسل‌های مختلف همین مدل
            معمولاً فرق دارند.
          </p>
          <p className="leading-9 text-muted">
            اگر شماره فنی قطعه فعلی را دارید،{" "}
            <Link href="/search" className="text-brass-dark link-brass">
              همان کد را جستجو کنید
            </Link>{" "}
            تا کدهای معادل و جایگزین را هم ببینید. برای قیمت روز{" "}
            <Link href="/inquiry" className="text-brass-dark link-brass">
              استعلام بدهید
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
