import Link from "next/link";
import { getMakes, getCategoryTree, priceOffers } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { SearchPanel } from "@/components/SearchPanel";
import { CarBlueprint } from "@/components/CarBlueprint";
import { HeroStage } from "@/components/HeroStage";

export default async function HomePage() {
  const [makes, categories, settings, latest, posts] = await Promise.all([
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
    prisma.post.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
  ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const priced = await Promise.all(
    latest.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );

  return (
    <div>
      {/* ---------------- سربرگ: کاپوت بسته ---------------- */}
      <section className="relative bg-carbon pb-36 pt-14 text-white">
        {/* کاغذ نقشه: شبکه میلی‌متری کم‌رنگ */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #b4832b 1px, transparent 1px), linear-gradient(to bottom, #b4832b 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(120% 90% at 25% 60%, black 20%, transparent 75%)",
          }}
        />

        {/* کروکی روی صحنه سه‌بعدی — از لبه پایین سربرگ بیرون می‌زند */}
        <div className="pointer-events-none absolute -bottom-6 left-0 z-20 hidden w-[52%] [mask-image:linear-gradient(to_bottom,black_62%,transparent_98%)] lg:block xl:w-[48%]">
          <HeroStage>
            <CarBlueprint className="w-full text-brass/55 drop-shadow-[0_26px_36px_rgba(0,0,0,0.55)] [mask-image:linear-gradient(to_right,black_55%,transparent_97%)]" />
          </HeroStage>
          {/* سایه تماس روی خط مرز */}
          <div
            className="absolute bottom-8 left-[8%] h-6 w-[62%] rounded-[50%] blur-xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)" }}
          />
        </div>

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
      <div className="relative z-10 mx-auto -mt-20 max-w-[1120px] px-5">
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

      {/* بلاگ فنی — پاسخ سوال‌هایی که قبل از خرید پرسیده می‌شود */}
      {posts.length > 0 ? (
        <section className="mx-auto max-w-[1120px] px-5 pb-16">
          <div className="rule pb-6">
            <h2 className="font-display text-lg font-bold">از بلاگ فنی</h2>
            <span className="rule-label">journal</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="panel group flex flex-col p-6 transition-colors hover:border-brass"
              >
                <div className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-brass-dark">
                  {post.tag}
                </div>
                <h3 className="pt-3 font-display text-base font-bold leading-8 group-hover:text-brass-dark">
                  {post.title}
                </h3>
                <p className="pt-2 text-sm leading-7 text-muted">{post.excerpt}</p>
                <span className="tnum mt-auto pt-4 font-mono text-[0.64rem] text-faint">
                  {post.readMinutes} دقیقه مطالعه
                </span>
              </Link>
            ))}
          </div>

          <Link href="/blog" className="btn btn-ghost mt-6">
            همه مقاله‌ها
          </Link>
        </section>
      ) : null}
    </div>
  );
}
