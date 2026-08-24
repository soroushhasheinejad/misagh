import Link from "next/link";
import { getMakes, priceOffers } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { SearchPanel } from "@/components/SearchPanel";
import { CarBlueprint } from "@/components/CarBlueprint";
import { HeroStage } from "@/components/HeroStage";
import { faYearRange } from "@/lib/format";

/** تیتر بخش با نشان برنجی و لینک اختیاری سمت چپ */
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
  const [makes, categories, settings, latest, posts, partCount, generationCount, topVehicles] =
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
      prisma.vehicleGeneration.findMany({
        orderBy: { fitments: { _count: "desc" } },
        take: 8,
        include: {
          model: { include: { make: true } },
          _count: { select: { fitments: true } },
        },
      }),
    ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const priced = await Promise.all(
    latest.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );

  // مجموع قطعات هر دسته اصلی، شامل زیردسته‌ها
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
      body: "برند، مدل و سال را انتخاب کنید تا فقط قطعات سازگار با همان خودرو را ببینید.",
      href: "/vehicles",
      action: "فهرست خودروها",
    },
    {
      title: "با شماره فنی",
      body: "کد روی جعبه یا خود قطعه را وارد کنید. کدهای معادل و جایگزین هم می‌آیند.",
      href: "/search",
      action: "جستجوی کد",
    },
    {
      title: "با شماره شاسی",
      body: "اگر از نسل خودرو مطمئن نیستید، شماره شاسی ۱۷ رقمی را بدهید تا خودمان تشخیص دهیم.",
      href: "/vin",
      action: "خواندن شاسی",
    },
  ];

  const TRUST = [
    { title: "شماره فنی مشخص", body: "هر قطعه با کد سازنده ثبت شده، نه با یک نام کلی." },
    { title: "سازگاری بررسی‌شده", body: "خودروهایی که قطعه رویشان می‌خورد، جدا مشخص شده‌اند." },
    { title: "قیمت روز یا استعلام", body: "قیمت قدیمی نمایش نمی‌دهیم؛ نرخ نوسانی را استعلام می‌کنیم." },
  ];

  return (
    <div>
      {/* ---------------- سربرگ ---------------- */}
      <section className="relative bg-carbon pb-36 pt-16 text-white">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #b4832b 1px, transparent 1px), linear-gradient(to bottom, #b4832b 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(120% 90% at 25% 60%, black 20%, transparent 75%)",
          }}
        />

        <div className="pointer-events-none absolute -bottom-6 left-0 z-20 hidden w-[52%] [mask-image:linear-gradient(to_bottom,black_62%,transparent_98%)] lg:block xl:w-[48%]">
          <HeroStage>
            <CarBlueprint className="w-full text-brass/55 drop-shadow-[0_26px_36px_rgba(0,0,0,0.55)] [mask-image:linear-gradient(to_right,black_55%,transparent_97%)]" />
          </HeroStage>
          <div
            className="absolute bottom-8 left-[8%] h-6 w-[62%] rounded-[50%] blur-xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)" }}
          />
        </div>

        <div className="relative mx-auto max-w-[1120px] px-5">
          <div className="rise rise-1 flex items-center gap-2.5">
            <span className="size-[7px] rotate-45 bg-brass" />
            <span className="text-sm text-brass">قطعات کیا و هیوندا</span>
          </div>

          <h1 className="rise rise-1 max-w-2xl pt-5 font-display text-3xl font-black leading-[1.5] sm:text-[2.7rem]">
            قطعه‌ای که به خودروی شما می‌خورد، نه چیزی شبیه آن
          </h1>

          <p className="rise rise-2 max-w-xl pt-5 leading-8 text-white/65">
            خودرویتان را انتخاب کنید یا شماره فنی را وارد کنید. موجودی، زمان تحویل و کدهای معادل را
            پیش از خرید می‌بینید.
          </p>

          <div className="rise rise-2 flex flex-wrap items-center gap-3 pt-8">
            <span className="text-sm text-white/45">همین کد را امتحان کنید</span>
            <Link href="/search?q=58101-D3A00" className="plate plate-dark plate-lg">
              58101-D3A00
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- کنسول جستجو ---------------- */}
      <div className="relative z-10 mx-auto -mt-20 max-w-[1120px] px-5">
        <div className="rise rise-3">
          <SearchPanel makes={makes.map((m) => ({ id: m.id, nameFa: m.nameFa }))} />
        </div>

        {/* نوار اعتماد، چسبیده به کنسول */}
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
              <span className="tnum absolute left-5 top-5 font-display text-4xl font-black text-line-2 transition-colors group-hover:text-brass-soft">
                {(index + 1).toLocaleString("fa-IR")}
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
          note={`${partCount.toLocaleString("fa-IR")} قطعه، دسته‌بندی‌شده بر اساس سیستم خودرو`}
          href="/catalog"
          linkLabel="همه محصولات"
        />

        <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {categoryTotals.map((c) => (
            <div key={c.id} className="flex flex-col bg-surface p-5 transition-colors hover:bg-steel-2">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/catalog?categoryId=${c.id}`}
                  className="font-display text-base font-bold hover:text-brass-dark"
                >
                  {c.nameFa}
                </Link>
                <span className="tnum text-xs text-faint">
                  {c.total.toLocaleString("fa-IR")}
                </span>
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

      {/* ---------------- خودروهای پرقطعه ---------------- */}
      {topVehicles.length > 0 ? (
        <section className="mx-auto max-w-[1120px] px-5 pt-20">
          <SectionHead
            title="خودروهایی که بیشترین قطعه را داریم"
            note={`${generationCount.toLocaleString("fa-IR")} نسل کیا و هیوندا تحت پوشش است`}
            href="/vehicles"
            linkLabel="همه خودروها"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topVehicles.map((gen) => (
              <Link
                key={gen.id}
                href={`/catalog?generationId=${gen.id}`}
                className="panel flex items-center justify-between gap-3 p-4 transition-colors hover:border-brass"
              >
                <div>
                  <div className="font-display text-sm font-bold">
                    {gen.model.make.nameFa} {gen.model.nameFa}
                  </div>
                  <div className="tnum pt-1 text-xs text-faint">
                    {faYearRange(gen.yearStart, gen.yearEnd)}
                  </div>
                </div>
                <span className="tnum shrink-0 font-display text-base font-black text-brass-dark">
                  {gen._count.fitments.toLocaleString("fa-IR")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
                  {post.readMinutes.toLocaleString("fa-IR")} دقیقه مطالعه
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
            <h2 className="font-display text-xl font-black">قطعه‌تان را پیدا نکردید؟</h2>
            <p className="max-w-lg pt-2 leading-8 text-white/60">
              شماره فنی، عکس قطعه یا شماره شاسی را بفرستید. قیمت و موجودی را همان روز اعلام می‌کنیم.
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
