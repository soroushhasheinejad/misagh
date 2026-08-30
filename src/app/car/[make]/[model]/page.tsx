import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getModelBySlug,
  getCategoriesForModel,
  getPartsForModel,
  getAllModels,
} from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { faYearRange, faNumber } from "@/lib/format";
import { Breadcrumbs, breadcrumbSchema, JsonLd } from "@/components/Seo";
import { resolveSeo } from "@/lib/seo-content";
import { buildModelVars } from "@/lib/seo-vars";
import { Markdown } from "@/lib/markdown";

type Params = { make: string; model: string };

/**
 * صفحه فرود هر مدل خودرو — «لوازم یدکی سانتافه».
 * این عبارت پرجستجوترین الگوی این صنف است و تا امروز صفحه‌ای برایش نداشتیم.
 */

export async function generateStaticParams() {
  const models = await getAllModels();
  return models.map((m) => ({ make: m.make.slug, model: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { make, model } = await params;
  const found = await getModelBySlug(make, model);
  if (!found) return { title: "خودرو پیدا نشد" };

  const title = `لوازم یدکی ${found.nameFa}`;
  const seo = await resolveSeo("CAR_MODEL", found.id, await buildModelVars(found.id));

  return {
    title: seo.metaTitle ?? title,
    description:
      seo.metaDescription ??
      `${title} ${found.make.nameFa} — قطعات اصلی و های‌کپی با شماره فنی، سازگاری بررسی‌شده و استعلام قیمت روز.`,
    alternates: { canonical: `/car/${make}/${model}` },
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CarModelPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { make, model } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const found = await getModelBySlug(make, model);
  if (!found) notFound();

  const [categories, results, settings] = await Promise.all([
    getCategoriesForModel(found.id),
    getPartsForModel(found.id, { page }),
    getSettings(),
  ]);

  const seo = await resolveSeo("CAR_MODEL", found.id, await buildModelVars(found.id));
  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const title = seo.h1 ?? `لوازم یدکی ${found.nameFa}`;
  const years = found.generations.map((g) => faYearRange(g.yearStart, g.yearEnd));

  const crumbs = [
    { name: "خانه", url: "/" },
    { name: "خودروها", url: "/vehicles" },
    { name: found.make.nameFa, url: `/car/${make}/${model}` },
    { name: title, url: `/car/${make}/${model}` },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <section className="border-b border-brass/25 bg-carbon py-10 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <Breadcrumbs items={crumbs.slice(0, -1)} />
          <h1 className="pt-4 font-display text-2xl font-black">{title}</h1>
          <p className="max-w-2xl pt-3 leading-8 text-white/60">
            {seo.intro
              ? seo.intro
              : results.total > 0
                ? `${faNumber(results.total)} قطعه برای ${found.make.nameFa} ${found.nameFa} در کاتالوگ ما ثبت شده است؛ همه با شماره فنی سازنده و سازگاری بررسی‌شده.`
                : `برای ${found.make.nameFa} ${found.nameFa} هنوز قطعه‌ای ثبت نشده است. درخواستتان را بفرستید تا تامین کنیم.`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        {/* نسل‌های خودرو */}
        {found.generations.length > 0 ? (
          <section className="pb-10">
            <div className="flex items-center gap-2.5 pb-4">
              <span className="size-[7px] rotate-45 bg-brass" />
              <h2 className="font-display text-base font-bold">
                نسل‌های {found.nameFa} که پوشش می‌دهیم
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {found.generations.map((gen) => (
                <Link
                  key={gen.id}
                  href={`/catalog?generationId=${gen.id}`}
                  className="panel px-4 py-2 text-sm transition-colors hover:border-brass"
                >
                  {gen.nameFa}
                  <span className="tnum pr-2 text-xs text-faint">
                    {faYearRange(gen.yearStart, gen.yearEnd)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* دسته‌های قطعه این خودرو — لینک به صفحه ترکیبی */}
        {categories.length > 0 ? (
          <section className="pb-10">
            <div className="flex items-center gap-2.5 pb-4">
              <span className="size-[7px] rotate-45 bg-brass" />
              <h2 className="font-display text-base font-bold">
                قطعات {found.nameFa} بر اساس دسته
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 12).map(({ category, count }) => (
                <Link
                  key={category.id}
                  href={`/car/${make}/${model}/${category.slug}`}
                  className="panel flex items-center justify-between gap-3 p-4 transition-colors hover:border-brass"
                >
                  <span className="text-sm font-medium">
                    {category.nameFa} {found.nameFa}
                  </span>
                  <span className="tnum text-xs text-faint">{faNumber(count)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* فهرست قطعات */}
        {results.items.length > 0 ? (
          <section>
            <div className="flex items-center gap-2.5 pb-5">
              <span className="size-[7px] rotate-45 bg-brass" />
              <h2 className="font-display text-base font-bold">
                همه قطعات {found.make.nameFa} {found.nameFa}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.items.map(({ part, offers }) => (
                <ProductCard key={part.id} part={part} offers={offers} unit={unit} />
              ))}
            </div>

            {results.pageCount > 1 ? (
              <nav className="flex items-center justify-between gap-3 pt-8">
                {page > 1 ? (
                  <Link
                    href={`/car/${make}/${model}${page > 2 ? `?page=${page - 1}` : ""}`}
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
                    href={`/car/${make}/${model}?page=${page + 1}`}
                    className="btn btn-ghost px-4 py-2 text-xs"
                  >
                    صفحه بعد
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>
        ) : null}

        {/* متن راهنما — اگر در پنل سئو نوشته شده باشد، همان می‌آید */}
        {seo.body ? (
          <section className="max-w-[68ch] pt-12">
            <Markdown source={seo.body} />
          </section>
        ) : (
        <section className="max-w-[68ch] pt-12">
          <div className="flex items-center gap-2.5 pb-4">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">
              خرید لوازم یدکی {found.nameFa}
            </h2>
          </div>
          <p className="pb-4 leading-9 text-muted">
            برای {found.make.nameFa} {found.nameFa}
            {years.length > 0 ? ` (${years.join("، ")})` : ""} قطعات موتوری، جلوبندی، ترمز،
            بدنه و برقی موجود است. هر قطعه با شماره فنی سازنده ثبت شده، پس اگر کد قطعه فعلی
            خودرو را دارید می‌توانید همان را جستجو کنید و مطمئن شوید دقیقاً همان قطعه را
            می‌گیرید.
          </p>
          <p className="pb-4 leading-9 text-muted">
            بیشترین اشتباه خرید در این مدل، انتخاب نسل اشتباه است. سال ساخت روی کارت خودرو
            شمسی است و کاتالوگ قطعه میلادی؛ اگر مطمئن نیستید، شماره شاسی ۱۷ رقمی را در صفحه{" "}
            <Link href="/vin" className="text-brass-dark link-brass">
              تشخیص با شماره شاسی
            </Link>{" "}
            وارد کنید تا خودمان نسل را مشخص کنیم.
          </p>
          <p className="leading-9 text-muted">
            قیمت قطعات به نرخ روز ارز بستگی دارد، به همین دلیل به‌جای نمایش قیمت قدیمی،
            استعلام روز می‌دهیم.{" "}
            <Link href="/inquiry" className="text-brass-dark link-brass">
              درخواست استعلام
            </Link>{" "}
            بدهید تا همان روز قیمت و موجودی را اعلام کنیم.
          </p>
        </section>
        )}
      </div>
    </div>
  );
}
