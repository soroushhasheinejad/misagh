import Link from "next/link";
import { getMakes, priceOffers } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { SearchPanel } from "@/components/SearchPanel";
import { HeroStage } from "@/components/HeroStage";
import { faYearRange, faNumber } from "@/lib/format";

/** تیتر بخش با نشان برنجی و لینک اختیاری */
function SectionHead({
  title,
  note,
  href,
  linkLabel,
}: {
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-7">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="size-[7px] rotate-45 bg-brass" />
          <h2 className="font-display text-xl font-black">{title}</h2>
        </div>
        {note ? <p className="pt-2 text-sm text-muted">{note}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="text-sm text-brass-dark link-brass">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [makes, categories, settings, latest, posts, partCount, generationCount, showcase] =
    await Promise.all([
      getMakes(),
      prisma.partCategory.findMany({
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: { _count: { select: { parts: true } } },
          },
          _count: { select: { parts: true } },
        },
      }),
      getSettings(),
      prisma.part.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          category: true,
          numbers: { where: { isPrimary: true }, take: 1 },
          offers: {
            where: { status: { not: "DISABLED" } },
            include: { brand: true, supplier: true },
          },
        },
      }),
      prisma.post.findMany({
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        take: 3,
      }),
      prisma.part.count({ where: { isActive: true } }),
      prisma.vehicleGeneration.count(),
      // یک قطعه واقعی برای کارت نمونه سربرگ
      prisma.part.findFirst({
        where: {
          isActive: true,
          offers: { some: { basePriceIrr: { not: null }, stockQty: { gt: 0 } } },
          fitments: { some: { generationId: { not: null } } },
        },
        include: {
          numbers: { where: { isPrimary: true }, take: 1 },
          fitments: {
            where: { generationId: { not: null } },
            include: { generation: { include: { model: { include: { make: true } } } } },
            take: 2,
          },
          offers: {
            where: { status: { not: "DISABLED" } },
            include: { brand: true, supplier: true },
          },
        },
      }),
    ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";

  const priced = await Promise.all(
    latest.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );

  const showcaseOffers = showcase
    ? await priceOffers(showcase, showcase.offers, { settings })
    : [];
  const showcasePrice = showcaseOffers.find((o) => o.price.kind === "price");
  const showcaseInStock = showcaseOffers.some((o) => o.stockQty > 0);
  const showcaseFit = showcase?.fitments[0]?.generation;

  const categoryTotals = categories
    .filter((c) => c.slug !== "uncategorized")
    .map((c) => ({
      ...c,
      total: c._count.parts + c.children.reduce((sum, ch) => sum + ch._count.parts, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const FINDERS = [
    {
      title: "از روی خودرو",
      body: "برند، مدل و سال را بگویید تا فهرست به قطعات همان خودرو محدود شود.",
      href: "/vehicles",
      action: "انتخاب خودرو",
    },
    {
      title: "با شماره فنی",
      body: "کد روی جعبه یا خود قطعه را وارد کنید؛ کدهای معادل و جایگزین هم می‌آیند.",
      href: "/search",
      action: "جستجوی کد",
    },
    {
      title: "با شماره شاسی",
      body: "از نسل خودرو مطمئن نیستید؟ ۱۷ رقم شاسی را بدهید تا خودمان تشخیص دهیم.",
      href: "/vin",
      action: "خواندن شاسی",
    },
  ];

  const TRUST = [
    {
      title: "شماره فنی، نه اسم کلی",
      body: "هر قطعه با کد سازنده ثبت شده؛ همان کدی که روی جعبه است.",
    },
    {
      title: "سازگاری بررسی‌شده",
      body: "خودروهایی که قطعه رویشان می‌نشیند، جدا ثبت شده‌اند.",
    },
    {
      title: "قیمت روز، نه قیمت پارسال",
      body: "نرخ نوسانی را نمایش نمی‌دهیم؛ همان روز استعلام می‌کنیم.",
    },
  ];

  return (
    <div>
      {/* ---------------- سربرگ ---------------- */}
      <section className="relative overflow-hidden bg-carbon pb-32 pt-16 text-white">
        {/* کاغذ نقشه */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #b4832b 1px, transparent 1px), linear-gradient(to bottom, #b4832b 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(110% 80% at 70% 40%, black 15%, transparent 72%)",
          }}
        />
        {/* هاله برنجی پشت کارت نمونه */}
        <div
          className="pointer-events-none absolute -left-40 top-10 hidden size-[520px] rounded-full opacity-[0.09] blur-3xl lg:block"
          style={{ background: "radial-gradient(closest-side, #b4832b, transparent)" }}
        />

        <div className="relative mx-auto max-w-[1120px] px-5">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,360px)]">
            {/* ستون متن */}
            <div>
              <div className="rise rise-1 flex items-center gap-2.5">
                <span className="size-[7px] rotate-45 bg-brass" />
                <span className="text-sm text-brass">قطعات یدکی کیا و هیوندا</span>
              </div>

              <h1 className="rise rise-1 max-w-xl pt-6 font-display text-[2.1rem] font-black leading-[1.45] sm:text-[2.9rem]">
                قطعه درست،
                <br />
                از همان بار اول
              </h1>

              <p className="rise rise-2 max-w-lg pt-6 text-[1.05rem] leading-9 text-white/65">
                خودرو یا شماره فنی را بدهید؛ سازگاری، موجودی و زمان تحویل را پیش از پرداخت
                می‌بینید.
              </p>

              {/* ریل آمار */}
              <div className="rise rise-2 flex flex-wrap items-center gap-x-5 gap-y-3 pt-8 text-sm text-white/55">
                <span className="tnum">
                  <b className="font-display text-base font-black text-white">
                    {faNumber(partCount)}
                  </b>{" "}
                  قطعه در کاتالوگ
                </span>
                <span className="size-[5px] rotate-45 bg-brass/70" />
                <span className="tnum">
                  <b className="font-display text-base font-black text-white">
                    {faNumber(generationCount)}
                  </b>{" "}
                  نسل خودرو
                </span>
                <span className="size-[5px] rotate-45 bg-brass/70" />
                <span>کد معادل و جایگزین</span>
              </div>
            </div>

            {/* کارت نمونه — چیزی که سایت واقعاً تحویل می‌دهد */}
            {showcase ? (
              <div className="rise rise-3 hidden lg:block">
                <HeroStage>
                  <article className="panel panel-brass bg-surface p-6 text-ink shadow-[0_30px_60px_-25px_rgba(0,0,0,0.75)]">
                    <div className="flex items-center gap-2 text-xs text-brass-dark">
                      <span className="size-[6px] rotate-45 bg-brass" />
                      نمونه نتیجه جستجو
                    </div>

                    <h2 className="pt-4 font-display text-base font-bold leading-7">
                      {showcase.nameFa}
                    </h2>

                    {showcase.numbers[0] ? (
                      <div className="pt-4">
                        <span className="plate plate-lg">{showcase.numbers[0].number}</span>
                      </div>
                    ) : null}

                    {showcaseFit ? (
                      <div className="mt-5 border-t border-line pt-4">
                        <div className="text-xs text-muted">سازگار با</div>
                        <div className="pt-1 font-display text-sm font-bold">
                          {showcaseFit.model.make.nameFa} {showcaseFit.model.nameFa}
                        </div>
                        <div className="tnum pt-0.5 text-xs text-faint">
                          {faYearRange(showcaseFit.yearStart, showcaseFit.yearEnd)}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                      <div>
                        {showcasePrice && showcasePrice.price.kind === "price" ? (
                          <div className="tnum font-display text-xl font-black">
                            {formatMoney(showcasePrice.price.amountIrr, unit)}
                            <span className="pr-1 text-xs font-medium text-muted">
                              {moneyLabel(unit)}
                            </span>
                          </div>
                        ) : (
                          <div className="font-display text-sm font-bold text-alert">
                            استعلام قیمت
                          </div>
                        )}
                        <div className={showcaseInStock ? "pt-1 text-xs text-ok" : "pt-1 text-xs text-faint"}>
                          {showcaseInStock ? "موجود در انبار" : "ناموجود"}
                        </div>
                      </div>
                      <Link
                        href={`/part/${showcase.slug}`}
                        className="btn btn-ghost px-4 py-2 text-xs"
                      >
                        دیدن قطعه
                      </Link>
                    </div>
                  </article>
                </HeroStage>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- کنسول جستجو ---------------- */}
      <div className="relative z-10 mx-auto -mt-20 max-w-[1120px] px-5">
        <div className="rise rise-3">
          <SearchPanel makes={makes.map((m) => ({ id: m.id, nameFa: m.nameFa }))} />
        </div>

        <div className="grid gap-px overflow-hidden rounded-b-md border-x border-b border-line bg-line sm:grid-cols-3">
          {TRUST.map((item) => (
            <div key={item.title} className="bg-steel-2 px-5 py-4">
              <div className="font-display text-sm font-bold">{item.title}</div>
              <p className="pt-1 text-xs leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- سه راه پیدا کردن قطعه ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-20">
        <SectionHead
          title="سه راه برای رسیدن به قطعه"
          note="هر کدام را که راحت‌تر است انتخاب کنید؛ هر سه به یک نتیجه می‌رسند."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {FINDERS.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="panel group relative flex flex-col overflow-hidden p-6 transition-colors hover:border-brass"
            >
              <span className="tnum absolute left-5 top-4 font-display text-4xl font-black text-line-2 transition-colors group-hover:text-brass-soft">
                {faNumber(index + 1)}
              </span>
              <h3 className="font-display text-base font-bold">{item.title}</h3>
              <p className="pt-2 text-sm leading-7 text-muted">{item.body}</p>
              <span className="mt-auto pt-5 text-sm font-bold text-brass-dark">
                {item.action} ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- دسته‌بندی ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-20">
        <SectionHead
          title="دسته‌بندی قطعات"
          note="بر اساس سیستم خودرو مرتب شده — از ترمز و موتور تا بدنه و برق"
          href="/catalog"
          linkLabel="همه محصولات"
        />

        <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {categoryTotals.map((c) => (
            <div
              key={c.id}
              className="flex flex-col bg-surface p-5 transition-colors hover:bg-steel-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/catalog?categoryId=${c.id}`}
                  className="font-display text-base font-bold hover:text-brass-dark"
                >
                  {c.nameFa}
                </Link>
                <span className="tnum text-xs text-faint">{faNumber(c.total)}</span>
              </div>
              <ul className="pt-3 text-sm text-muted">
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

      {/* ---------------- تازه‌ترین قطعات ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-20">
        <SectionHead title="تازه‌ترین قطعات" href="/catalog" linkLabel="همه محصولات" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {priced.map(({ part, offers }) => {
            const best = offers.find((o) => o.price.kind === "price");
            return (
              <article
                key={part.id}
                className="panel flex flex-col p-5 transition-colors hover:border-brass"
              >
                <div className="text-xs text-faint">{part.category.nameFa}</div>
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
                <div className="mt-auto pt-5">
                  {best && best.price.kind === "price" ? (
                    <div className="tnum font-display text-lg font-black">
                      {formatMoney(best.price.amountIrr, unit)}
                      <span className="pr-1 text-xs font-medium text-muted">
                        {moneyLabel(unit)}
                      </span>
                    </div>
                  ) : (
                    <div className="font-display text-sm font-bold text-alert">استعلام قیمت</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------- بلاگ ---------------- */}
      {posts.length > 0 ? (
        <section className="mx-auto max-w-[1120px] px-5 pt-20">
          <SectionHead
            title="قبل از خرید بخوانید"
            note="سوال‌هایی که مشتری‌ها بیشتر از همه می‌پرسند، یک بار و کامل جواب داده شده"
            href="/blog"
            linkLabel="همه مقاله‌ها"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="panel group flex flex-col p-6 transition-colors hover:border-brass"
              >
                <div className="text-xs text-brass-dark">{post.tag}</div>
                <h3 className="pt-3 font-display text-base font-bold leading-8 group-hover:text-brass-dark">
                  {post.title}
                </h3>
                <p className="pt-2 text-sm leading-7 text-muted">{post.excerpt}</p>
                <span className="tnum mt-auto pt-5 text-xs text-faint">
                  {faNumber(post.readMinutes)} دقیقه مطالعه
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- نوار پایانی ---------------- */}
      <section className="mx-auto max-w-[1120px] px-5 pt-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-md bg-carbon px-8 py-10 text-white">
          <div>
            <h2 className="font-display text-xl font-black">قطعه‌تان در کاتالوگ نبود؟</h2>
            <p className="max-w-lg pt-2 leading-8 text-white/60">
              شماره فنی، عکس قطعه یا شماره شاسی را بفرستید. قیمت و زمان تحویل را همان روز اعلام
              می‌کنیم.
            </p>
          </div>
          <Link href="/inquiry" className="btn btn-brass">
            ثبت استعلام
          </Link>
        </div>
      </section>
    </div>
  );
}
