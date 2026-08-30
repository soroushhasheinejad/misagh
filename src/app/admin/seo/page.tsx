import Link from "next/link";
import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { summarize } from "@/lib/seo-inventory";
import { ENTITY_LABEL } from "@/lib/seo-content";
import { faNumber } from "@/lib/format";
import { restoreDefaultTemplates } from "./actions";

export const dynamic = "force-dynamic";

const TYPES: SeoEntity[] = ["PART", "CAR_MODEL", "CAR_CATEGORY", "CATEGORY"];

function Bar({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-2">
      <div
        className="h-full rounded-full bg-brass"
        style={{ width: `${pct}%` }}
        aria-label={`${pct}٪`}
      />
    </div>
  );
}

export default async function SeoDashboard() {
  const [summaries, templateCount, zeroResults, postCount] = await Promise.all([
    Promise.all(TYPES.map((t) => summarize(t))),
    prisma.contentTemplate.count({ where: { isActive: true } }),
    prisma.searchLog
      .groupBy({
        by: ["query"],
        where: { resultCount: 0 },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 12,
      })
      .catch(() => []),
    prisma.post.count({ where: { isPublished: true } }),
  ]);

  const totalPages = summaries.reduce((s, x) => s + x.total, 0);
  const totalDone = summaries.reduce((s, x) => s + x.withContent, 0);
  const overall = totalPages ? Math.round((totalDone / totalPages) * 100) : 0;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-xl font-black">سئوی محتوایی</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          هر صفحه‌ای که برای گوگل مهم است اینجا فهرست شده و وضعیت محتوایش را می‌بینید.
          می‌توانید متن هر صفحه را دستی بنویسید، یا با قالب برای هزاران صفحه یک‌جا بسازید و
          بعد صفحه‌های مهم را دستی بهتر کنید.
        </p>
      </header>

      {templateCount === 0 ? (
        <form action={restoreDefaultTemplates} className="panel panel-brass p-5">
          <div className="font-display text-sm font-bold">هنوز قالبی ساخته نشده</div>
          <p className="max-w-[60ch] pt-2 text-sm leading-7 text-muted">
            قالب‌های آماده شامل عنوان، توضیح متا و متن بلند برای صفحه قطعه، صفحه خودرو و
            ترکیب دسته×خودرو است. با یک کلیک اضافه می‌شوند و بعد قابل ویرایش‌اند.
          </p>
          <button type="submit" className="btn btn-brass mt-4">
            ساخت قالب‌های پیش‌فرض
          </button>
        </form>
      ) : null}

      {/* ---------------- خلاصه پوشش ---------------- */}
      <section>
        <div className="flex items-center gap-2.5 pb-4">
          <span className="size-[7px] rotate-45 bg-brass" />
          <h2 className="font-display text-base font-bold">پوشش محتوا</h2>
        </div>

        <div className="panel p-5">
          <div className="flex items-baseline justify-between pb-2">
            <span className="text-sm text-muted">صفحه‌های دارای محتوای سئو</span>
            <span className="tnum font-display text-lg font-black">
              {faNumber(totalDone)} از {faNumber(totalPages)}
              <span className="pr-2 text-sm font-medium text-muted">({faNumber(overall)}٪)</span>
            </span>
          </div>
          <Bar value={totalDone} total={totalPages} />
        </div>

        <div className="grid gap-3 pt-4 sm:grid-cols-2">
          {summaries.map((s) => (
            <Link
              key={s.entityType}
              href={`/admin/seo/pages?type=${s.entityType}`}
              className="panel p-5 transition-colors hover:border-brass"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="font-display text-sm font-bold">
                  {ENTITY_LABEL[s.entityType]}
                </span>
                <span
                  className={`tnum text-xs font-bold ${
                    s.avg >= 80 ? "text-ok" : s.avg >= 50 ? "text-brass-dark" : "text-alert"
                  }`}
                >
                  میانگین امتیاز {faNumber(s.avg)}
                </span>
              </div>
              <Bar value={s.withContent} total={s.total} />
              <div className="flex flex-wrap gap-4 pt-3 text-xs text-muted">
                <span className="tnum">{faNumber(s.total)} صفحه</span>
                <span className="tnum text-ok">{faNumber(s.withContent)} دارای محتوا</span>
                {s.missing > 0 ? (
                  <span className="tnum text-alert">{faNumber(s.missing)} بدون محتوا</span>
                ) : null}
                {s.thin > 0 ? (
                  <span className="tnum text-brass-dark">{faNumber(s.thin)} محتوای نازک</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- ابزارها ---------------- */}
      <section>
        <div className="flex items-center gap-2.5 pb-4">
          <span className="size-[7px] rotate-45 bg-brass" />
          <h2 className="font-display text-base font-bold">ابزارها</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/admin/seo/pages",
              title: "صفحه‌ها و امتیازشان",
              desc: "فهرست همه صفحه‌ها با فیلتر «بدون محتوا» و «محتوای نازک»؛ ضعیف‌ترین‌ها بالا",
            },
            {
              href: "/admin/seo/generate",
              title: "تولید گروهی محتوا",
              desc: "متن هزاران صفحه را با قالب یک‌جا بساز، بدون دست زدن به متن‌های دستی",
            },
            {
              href: "/admin/seo/templates",
              title: "قالب‌های محتوا",
              desc: "عنوان، توضیح متا و متن بلند هر نوع صفحه؛ با جای‌گذارهای فارسی",
            },
            {
              href: "/admin/posts",
              title: `مقاله‌ها (${faNumber(postCount)} منتشرشده)`,
              desc: "محتوای آموزشی که به صفحه‌های محصول لینک می‌دهد",
            },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="panel p-5 transition-colors hover:border-brass"
            >
              <div className="font-display text-sm font-bold">{tool.title}</div>
              <p className="pt-2 text-xs leading-6 text-muted">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- جستجوهای بی‌نتیجه ---------------- */}
      {zeroResults.length > 0 ? (
        <section>
          <div className="flex items-center gap-2.5 pb-4">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">
              چیزهایی که مشتری جستجو کرد و پیدا نکرد
            </h2>
          </div>
          <p className="max-w-[68ch] pb-4 text-sm leading-7 text-muted">
            هر ردیف یک تقاضای واقعی است که جواب ندادیم. اگر قطعه‌اش را داریم، نامش را در
            کاتالوگ اصلاح کنید؛ اگر نداریم، یک مقاله یا صفحه برایش بسازید.
          </p>
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <table className="spec">
              <thead>
                <tr>
                  <th>عبارت</th>
                  <th>تعداد جستجو</th>
                </tr>
              </thead>
              <tbody>
                {zeroResults.map((row) => (
                  <tr key={row.query}>
                    <td className="font-medium">{row.query}</td>
                    <td className="tnum text-muted">{faNumber(row._count.query)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
