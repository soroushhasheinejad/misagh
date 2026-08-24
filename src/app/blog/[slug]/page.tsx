import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/lib/markdown";
import { priceOffers } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "مقاله پیدا نشد" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

function faDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(date);
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await prisma.post.findFirst({
    where: { slug, isPublished: true },
    include: { category: true, generation: { include: { model: { include: { make: true } } } } },
  });
  if (!post) notFound();

  const [more, settings] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, id: { not: post.id } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    getSettings(),
  ]);

  // قطعات مرتبط با موضوع مقاله
  const relatedParts = post.categoryId
    ? await prisma.part.findMany({
        where: { categoryId: post.categoryId, isActive: true },
        include: {
          numbers: { where: { isPrimary: true }, take: 1 },
          offers: { where: { status: { not: "DISABLED" } }, include: { brand: true, supplier: true } },
        },
        take: 3,
      })
    : [];

  const relatedPriced = await Promise.all(
    relatedParts.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  return (
    <div>
      <article>
        <header className="border-b border-brass/25 bg-carbon py-14 text-white">
          <div className="mx-auto max-w-[1120px] px-5">
            <Link
              href="/blog"
              className="text-xs text-brass hover:text-brass-lite"
            >
              ← بلاگ
            </Link>
            <h1 className="max-w-3xl pt-5 font-display text-3xl font-black leading-[1.55]">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 pt-5 text-xs text-white/45">
              <span className="text-brass">{post.tag}</span>
              <span>{faDate(post.publishedAt)}</span>
              <span className="tnum">{post.readMinutes} دقیقه مطالعه</span>
              <span>{post.author}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1120px] px-5 py-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="border-r-[3px] border-brass pr-5 text-lg leading-9 text-ink">
                {post.excerpt}
              </p>
              <div className="pt-8">
                <Markdown source={post.content} />
              </div>

              {/* پایان مقاله: مسیر بعدی خواننده */}
              <div className="panel mt-12 flex flex-wrap items-center justify-between gap-4 bg-steel-2 p-6">
                <div>
                  <div className="font-display text-base font-bold">قطعه‌تان را پیدا نکردید؟</div>
                  <p className="pt-1 text-sm text-muted">
                    شماره فنی یا مشخصات خودرو را بفرستید، قیمت و موجودی را اعلام می‌کنیم.
                  </p>
                </div>
                <Link href="/inquiry" className="btn btn-brass">
                  استعلام قیمت
                </Link>
              </div>
            </div>

            <aside className="flex flex-col gap-8">
              {post.category ? (
                <div>
                  <div className="font-display text-sm font-bold">
                    قطعات {post.category.nameFa}
                  </div>
                  <div className="flex flex-col gap-2 pt-3">
                    {relatedPriced.map(({ part, offers }) => {
                      const best = offers.find((o) => o.price.kind === "price");
                      return (
                        <Link
                          key={part.id}
                          href={`/part/${part.slug}`}
                          className="panel p-3 transition-colors hover:border-brass"
                        >
                          <div className="text-xs leading-6">{part.nameFa}</div>
                          {part.numbers[0] ? (
                            <div className="pt-2">
                              <span className="plate text-[0.65rem]">{part.numbers[0].number}</span>
                            </div>
                          ) : null}
                          <div className="tnum pt-2 font-display text-sm font-bold">
                            {best && best.price.kind === "price" ? (
                              <>
                                {formatMoney(best.price.amountIrr, unit)}
                                <span className="pr-1 text-[0.65rem] font-medium text-muted">
                                  {moneyLabel(unit)}
                                </span>
                              </>
                            ) : (
                              <span className="text-alert">استعلام قیمت</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                    <Link
                      href={`/catalog?categoryId=${post.categoryId}`}
                      className="btn btn-ghost mt-1 px-4 py-2 text-xs"
                    >
                      همه قطعات این دسته
                    </Link>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="flex flex-col gap-3">
                  {more.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                      <div className="text-xs text-brass-dark">
                        {p.tag}
                      </div>
                      <div className="pt-1 text-sm leading-7 group-hover:text-brass-dark">
                        {p.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}
