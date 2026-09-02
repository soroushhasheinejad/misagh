import Link from "next/link";
import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { faNumber } from "@/lib/format";
import { wordCount, SLOT_LIMITS, ENTITY_LABEL } from "@/lib/seo-content";
import { Section } from "@/components/admin/Form";

export const dynamic = "force-dynamic";

/**
 * گزارش‌های سئو.
 *
 * چیزی که در مدیریت هزاران صفحه واقعاً وقت می‌برد، پیدا کردن مشکل است نه حل
 * کردنش. این صفحه پنج مشکلی را که بیشترین اثر را روی رتبه دارند، با نام و
 * لینک مستقیم نشان می‌دهد.
 */

const TOP = 25;

function editHref(type: SeoEntity, key: string) {
  return `/admin/seo/edit?type=${type}&key=${encodeURIComponent(key)}`;
}

export default async function SeoReportsPage() {
  const rows = await prisma.seoContent.findMany({
    select: {
      entityType: true,
      entityKey: true,
      metaTitle: true,
      metaDescription: true,
      intro: true,
      body: true,
      targetKeyword: true,
      noindex: true,
    },
  });

  // ---- عنوان تکراری: دو صفحه با یک عنوان با هم رقابت می‌کنند ----
  const titleGroups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.metaTitle?.trim();
    if (!key) continue;
    const list = titleGroups.get(key) ?? [];
    list.push(row);
    titleGroups.set(key, list);
  }
  const duplicateTitles = [...titleGroups.entries()]
    .filter(([, list]) => list.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  // ---- توضیح متا تکراری ----
  const descGroups = new Map<string, number>();
  for (const row of rows) {
    const key = row.metaDescription?.trim();
    if (!key) continue;
    descGroups.set(key, (descGroups.get(key) ?? 0) + 1);
  }
  const duplicateDescriptions = [...descGroups.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1]);

  // ---- عنوان بلندتر از حد گوگل ----
  const longTitles = rows.filter(
    (r) => (r.metaTitle?.trim().length ?? 0) > SLOT_LIMITS.metaTitle.max,
  );

  // ---- محتوای نازک ----
  const thin = rows
    .map((r) => ({ ...r, words: wordCount(r.intro) + wordCount(r.body) }))
    .filter((r) => r.words < 150 && !r.noindex)
    .sort((a, b) => a.words - b.words);

  // ---- کلیدواژه‌ای که در عنوان نیست ----
  const keywordMissing = rows.filter(
    (r) => r.targetKeyword?.trim() && !r.metaTitle?.includes(r.targetKeyword.trim()),
  );

  // ---- قطعه بدون سازگاری: صفحه‌اش به هیچ صفحه خودرویی وصل نیست ----
  const [orphanParts, noNumberParts, withoutImages] = await Promise.all([
    prisma.part.count({ where: { isActive: true, fitments: { none: {} } } }),
    prisma.part.count({ where: { isActive: true, numbers: { none: {} } } }),
    prisma.part.count({ where: { isActive: true, images: { none: {} } } }),
  ]);

  const cards = [
    {
      label: "عنوان تکراری",
      value: duplicateTitles.length,
      hint: "دو صفحه با یک عنوان، رتبه هم را می‌خورند",
      tone: duplicateTitles.length > 0 ? "bad" : "ok",
    },
    {
      label: "توضیح متا تکراری",
      value: duplicateDescriptions.length,
      hint: "نرخ کلیک را پایین می‌آورد",
      tone: duplicateDescriptions.length > 0 ? "warn" : "ok",
    },
    {
      label: "عنوان بلند",
      value: longTitles.length,
      hint: "بیشتر از ۶۰ کاراکتر در نتایج بریده می‌شود",
      tone: longTitles.length > 0 ? "warn" : "ok",
    },
    {
      label: "محتوای نازک",
      value: thin.length,
      hint: "کمتر از ۱۵۰ کلمه متن یکتا",
      tone: thin.length > 0 ? "warn" : "ok",
    },
    {
      label: "قطعه بدون سازگاری",
      value: orphanParts,
      hint: "در صفحه هیچ خودرویی دیده نمی‌شود",
      tone: orphanParts > 0 ? "bad" : "ok",
    },
    {
      label: "قطعه بدون شماره فنی",
      value: noNumberParts,
      hint: "صفحه شماره فنی برایش ساخته نمی‌شود",
      tone: noNumberParts > 0 ? "bad" : "ok",
    },
    {
      label: "قطعه بدون تصویر",
      value: withoutImages,
      hint: "نرخ تبدیل پایین‌تر و بدون حضور در جستجوی تصویر",
      tone: withoutImages > 0 ? "warn" : "ok",
    },
    {
      label: "کلیدواژه غایب در عنوان",
      value: keywordMissing.length,
      hint: "کلیدواژه هدف در عنوان صفحه نیامده",
      tone: keywordMissing.length > 0 ? "warn" : "ok",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header>
        <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به خلاصه سئو
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">گزارش‌های سئو</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          هر کارت یک مشکل مشخص است که روی رتبه اثر می‌گذارد. عدد صفر یعنی آن مشکل را
          ندارید.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <div
              className={`tnum font-display text-2xl font-black ${
                card.value === 0
                  ? "text-ok"
                  : card.tone === "bad"
                    ? "text-alert"
                    : "text-brass-dark"
              }`}
            >
              {faNumber(card.value)}
            </div>
            <div className="pt-1 font-display text-sm font-bold">{card.label}</div>
            <p className="pt-1 text-xs leading-6 text-faint">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* ------------------------ عنوان‌های تکراری ------------------------ */}
      {duplicateTitles.length > 0 ? (
        <Section
          title="عنوان‌های تکراری"
          hint="گوگل بین دو صفحه با عنوان یکسان یکی را انتخاب می‌کند و دیگری را کنار می‌گذارد. عنوان یکی را با نام خودرو یا شماره فنی متمایز کنید."
        >
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <table className="spec">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th className="w-24">تعداد</th>
                  <th className="w-64">صفحه‌ها</th>
                </tr>
              </thead>
              <tbody>
                {duplicateTitles.slice(0, TOP).map(([title, list]) => (
                  <tr key={title}>
                    <td className="font-medium">{title}</td>
                    <td className="tnum text-alert">{faNumber(list.length)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {list.slice(0, 4).map((r) => (
                          <Link
                            key={r.entityKey}
                            href={editHref(r.entityType, r.entityKey)}
                            className="text-brass-dark hover:underline"
                          >
                            {ENTITY_LABEL[r.entityType]}
                          </Link>
                        ))}
                        {list.length > 4 ? (
                          <span className="tnum text-faint">
                            و {faNumber(list.length - 4)} صفحه دیگر
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {duplicateTitles.length > TOP ? (
            <p className="pt-3 text-xs text-faint">
              {faNumber(duplicateTitles.length - TOP)} مورد دیگر نشان داده نشده است.
            </p>
          ) : null}
        </Section>
      ) : null}

      {/* -------------------------- محتوای نازک -------------------------- */}
      {thin.length > 0 ? (
        <Section
          title="نازک‌ترین صفحه‌ها"
          hint="این‌ها بیشترین سود را از نوشتن متن می‌برند. رقیب اصلی بازار روی صفحه محصولش حدود ۸۰۰ کلمه دارد."
        >
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <table className="spec">
              <thead>
                <tr>
                  <th>صفحه</th>
                  <th className="w-28">نوع</th>
                  <th className="w-20">کلمه</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {thin.slice(0, TOP).map((r) => (
                  <tr key={`${r.entityType}-${r.entityKey}`}>
                    <td className="font-medium">{r.metaTitle ?? "بدون عنوان"}</td>
                    <td className="text-muted">{ENTITY_LABEL[r.entityType]}</td>
                    <td className="tnum text-alert">{faNumber(r.words)}</td>
                    <td>
                      <Link
                        href={editHref(r.entityType, r.entityKey)}
                        className="text-xs font-bold text-brass-dark hover:underline"
                      >
                        نوشتن
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* ------------------------ ایرادهای کاتالوگ ------------------------ */}
      {orphanParts > 0 || noNumberParts > 0 ? (
        <Section
          title="ایرادهایی که ریشه‌شان در کاتالوگ است"
          hint="این‌ها با نوشتن متن حل نمی‌شوند؛ باید داده قطعه کامل شود."
        >
          <div className="flex flex-col gap-3">
            {orphanParts > 0 ? (
              <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display text-sm font-bold">
                    <span className="tnum">{faNumber(orphanParts)}</span> قطعه سازگاری ندارد
                  </div>
                  <p className="pt-1 text-xs leading-6 text-muted">
                    این قطعه‌ها در هیچ صفحه خودرویی نمی‌آیند و عنوان سئوی کاملشان ساخته
                    نمی‌شود.
                  </p>
                </div>
                <Link href="/admin/parts" className="btn btn-ghost px-4 py-2 text-xs">
                  رفتن به قطعات
                </Link>
              </div>
            ) : null}

            {noNumberParts > 0 ? (
              <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-display text-sm font-bold">
                    <span className="tnum">{faNumber(noNumberParts)}</span> قطعه شماره فنی ندارد
                  </div>
                  <p className="pt-1 text-xs leading-6 text-muted">
                    صفحه اختصاصی شماره فنی برایشان ساخته نمی‌شود — همان صفحه‌ای که رقیب
                    ندارد.
                  </p>
                </div>
                <Link href="/admin/parts" className="btn btn-ghost px-4 py-2 text-xs">
                  رفتن به قطعات
                </Link>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
