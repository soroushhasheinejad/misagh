import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "بلاگ فنی",
  description:
    "راهنمای خرید و نگهداری قطعات کیا و هیوندا: خواندن شماره فنی، انتخاب بین جنیون و های‌کپی، و دوره تعویض قطعات مصرفی.",
};

function faDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(date);
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, ...(tag ? { tag } : {}) },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.post.groupBy({
      by: ["tag"],
      where: { isPublished: true },
      _count: true,
      orderBy: { _count: { tag: "desc" } },
    }),
  ]);

  const [lead, ...rest] = posts;

  return (
    <div>
      <section className="border-b border-brass/25 bg-carbon py-14 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
                    <h1 className="max-w-xl pt-4 font-display text-3xl font-black leading-[1.5]">
            هر چیزی که قبل از خرید قطعه باید بدانید
          </h1>
          <p className="max-w-lg pt-3 leading-8 text-white/60">
            نوشته‌های کوتاه و کاربردی درباره قطعات کیا و هیوندا — از خواندن شماره فنی تا تشخیص
            زمان تعویض لنت.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        {/* فیلتر موضوعی */}
        <div className="flex flex-wrap items-center gap-2 pb-10">
          <Link
            href="/blog"
            className={
              tag
                ? "btn btn-ghost px-4 py-1.5 text-xs"
                : "btn btn-primary px-4 py-1.5 text-xs"
            }
          >
            همه
          </Link>
          {tags.map((t) => (
            <Link
              key={t.tag}
              href={`/blog?tag=${encodeURIComponent(t.tag)}`}
              className={
                tag === t.tag
                  ? "btn btn-primary px-4 py-1.5 text-xs"
                  : "btn btn-ghost px-4 py-1.5 text-xs"
              }
            >
              {t.tag}
              <span className="tnum pr-1 font-mono text-[0.65rem] opacity-60">{t._count}</span>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-muted">هنوز مقاله‌ای در این موضوع منتشر نشده است.</p>
          </div>
        ) : null}

        {/* مقاله شاخص */}
        {lead ? (
          <Link
            href={`/blog/${lead.slug}`}
            className="panel panel-brass group block p-8 transition-colors hover:border-brass"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-faint">
              <span className="text-brass-dark">{lead.tag}</span>
              <span>{faDate(lead.publishedAt)}</span>
              <span className="tnum">{lead.readMinutes} دقیقه مطالعه</span>
            </div>
            <h2 className="max-w-2xl pt-4 font-display text-2xl font-black leading-[1.6] group-hover:text-brass-dark">
              {lead.title}
            </h2>
            <p className="max-w-2xl pt-3 leading-8 text-muted">{lead.excerpt}</p>
            <span className="mt-5 inline-block font-display text-sm font-bold text-brass-dark">
              خواندن مقاله ←
            </span>
          </Link>
        ) : null}

        {/* بقیه مقاله‌ها */}
        {rest.length > 0 ? (
          <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="panel group flex flex-col p-6 transition-colors hover:border-brass"
              >
                <div className="text-xs text-brass-dark">
                  {post.tag}
                </div>
                <h2 className="pt-3 font-display text-base font-bold leading-8 group-hover:text-brass-dark">
                  {post.title}
                </h2>
                <p className="pt-2 text-sm leading-7 text-muted">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-5 font-mono text-[0.64rem] text-faint">
                  <span>{faDate(post.publishedAt)}</span>
                  <span className="tnum">{post.readMinutes} دقیقه</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
