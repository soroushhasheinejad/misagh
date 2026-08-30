import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreSeo, wordCount, type Slot } from "@/lib/seo-content";
import { getTemplates } from "@/lib/seo-content";
import { renderTemplate } from "@/lib/seo-content";
import {
  buildPartVars,
  partVarsInclude,
  buildModelVars,
  buildCarCategoryVars,
  buildCategoryVars,
} from "@/lib/seo-vars";

/**
 * سیاهه صفحه‌های قابل بهینه‌سازی.
 *
 * پنل باید بتواند بگوید «کدام صفحه‌ها ضعیف‌اند» — بدون این، مدیریت سئوی
 * ۱۲ هزار آدرس عملاً ممکن نیست. اینجا هر نوع صفحه به یک شکل واحد
 * (کلید، عنوان، مسیر، وضعیت محتوا، امتیاز) درمی‌آید.
 */

export type SeoTarget = {
  entityType: SeoEntity;
  entityKey: string;
  label: string;
  path: string;
  /** کلیدواژه هدف؛ برای بررسی حضورش در عنوان */
  keyword: string;
  /** چند قطعه پشت این صفحه است — معیار اولویت */
  weight: number;
};

export type SeoRow = SeoTarget & {
  hasContent: boolean;
  isGenerated: boolean;
  noindex: boolean;
  words: number;
  score: number;
  issues: string[];
  metaTitle: string | null;
  metaDescription: string | null;
};

/**
 * همه ترکیب‌های دسته×خودرو که واقعاً قطعه دارند.
 * همان مجموعه‌ای که در نقشه سایت هم می‌آید، پس شمارش پنل با گوگل یکی است.
 */
export async function listCarCategoryPairs() {
  const rows = await prisma.part.findMany({
    where: { isActive: true, fitments: { some: { generation: { isNot: null } } } },
    select: {
      categoryId: true,
      category: { select: { nameFa: true, slug: true } },
      fitments: {
        select: {
          generation: {
            select: {
              model: {
                select: {
                  id: true,
                  nameFa: true,
                  slug: true,
                  make: { select: { slug: true, nameFa: true } },
                },
              },
            },
          },
        },
        take: 1,
      },
    },
    take: 20_000,
  });

  const map = new Map<
    string,
    { modelId: string; categoryId: string; label: string; path: string; count: number }
  >();

  for (const row of rows) {
    const model = row.fitments[0]?.generation?.model;
    if (!model || row.category.slug === "uncategorized") continue;
    const key = `${model.id}:${row.categoryId}`;
    const found = map.get(key);
    if (found) {
      found.count++;
      continue;
    }
    map.set(key, {
      modelId: model.id,
      categoryId: row.categoryId,
      label: `${row.category.nameFa} ${model.make.nameFa} ${model.nameFa}`,
      path: `/car/${model.make.slug}/${model.slug}/${row.category.slug}`,
      count: 1,
    });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** فهرست خام هدف‌های یک نوع صفحه */
export async function listTargets(entityType: SeoEntity, q?: string): Promise<SeoTarget[]> {
  const needle = q?.trim();

  if (entityType === "PART") {
    const parts = await prisma.part.findMany({
      where: {
        isActive: true,
        ...(needle
          ? {
              OR: [
                { nameFa: { contains: needle, mode: "insensitive" as const } },
                { titleFa: { contains: needle, mode: "insensitive" as const } },
                { numbers: { some: { normalized: { contains: needle.replace(/[\s-]/g, "").toUpperCase() } } } },
              ],
            }
          : {}),
      },
      select: { id: true, slug: true, nameFa: true, titleFa: true },
      orderBy: { updatedAt: "desc" },
      take: 4000,
    });
    return parts.map((p) => ({
      entityType,
      entityKey: p.id,
      label: p.titleFa ?? p.nameFa,
      path: `/part/${encodeURIComponent(p.slug)}`,
      keyword: p.nameFa,
      weight: 1,
    }));
  }

  if (entityType === "CAR_MODEL") {
    const models = await prisma.vehicleModel.findMany({
      where: { isActive: true, ...(needle ? { nameFa: { contains: needle } } : {}) },
      include: { make: true, _count: { select: { fitments: true } } },
    });
    return models.map((m) => ({
      entityType,
      entityKey: m.id,
      label: `لوازم یدکی ${m.nameFa}`,
      path: `/car/${m.make.slug}/${m.slug}`,
      keyword: m.nameFa,
      weight: m._count.fitments,
    }));
  }

  if (entityType === "CAR_CATEGORY") {
    const pairs = await listCarCategoryPairs();
    return pairs
      .filter((p) => !needle || p.label.includes(needle))
      .map((p) => ({
        entityType,
        entityKey: `${p.modelId}:${p.categoryId}`,
        label: p.label,
        path: p.path,
        keyword: p.label,
        weight: p.count,
      }));
  }

  if (entityType === "CATEGORY") {
    const cats = await prisma.partCategory.findMany({
      where: { isActive: true, ...(needle ? { nameFa: { contains: needle } } : {}) },
      include: { _count: { select: { parts: true } } },
    });
    return cats.map((c) => ({
      entityType,
      entityKey: c.id,
      label: c.nameFa,
      path: `/catalog?categoryId=${c.id}`,
      keyword: c.nameFa,
      weight: c._count.parts,
    }));
  }

  // صفحه‌های ثابت
  return STATIC_PAGES.map((p) => ({
    entityType: "PAGE" as SeoEntity,
    entityKey: p.path,
    label: p.label,
    path: p.path,
    keyword: p.label,
    weight: 0,
  })).filter((p) => !needle || p.label.includes(needle));
}

export const STATIC_PAGES = [
  { path: "/", label: "صفحه اصلی" },
  { path: "/catalog", label: "محصولات" },
  { path: "/vehicles", label: "خودروها" },
  { path: "/vin", label: "شماره شاسی" },
  { path: "/blog", label: "بلاگ" },
  { path: "/about", label: "درباره ما" },
  { path: "/contact", label: "تماس" },
  { path: "/shipping", label: "ارسال" },
  { path: "/returns", label: "بازگشت کالا" },
  { path: "/faq", label: "سوالات متداول" },
];

export type StatusFilter = "all" | "missing" | "thin" | "generated" | "manual" | "noindex";

/**
 * سیاهه کامل با وضعیت هر صفحه.
 * محتوای ذخیره‌شده مبناست؛ اگر صفحه‌ای رکورد ندارد، «بدون محتوا» شمرده می‌شود
 * حتی اگر قالب فعال باشد — چون تا وقتی تولید نشده، در دیتابیس چیزی نیست.
 */
export async function listRows(
  entityType: SeoEntity,
  opts: { q?: string; status?: StatusFilter } = {},
): Promise<SeoRow[]> {
  const targets = await listTargets(entityType, opts.q);
  const records = await prisma.seoContent.findMany({ where: { entityType } });
  const byKey = new Map(records.map((r) => [r.entityKey, r]));

  const rows: SeoRow[] = targets.map((t) => {
    const rec = byKey.get(t.entityKey);
    const words = wordCount(rec?.intro) + wordCount(rec?.body);
    const { score, issues } = scoreSeo({
      metaTitle: rec?.metaTitle,
      metaDescription: rec?.metaDescription,
      intro: rec?.intro,
      body: rec?.body,
      keyword: t.keyword,
      internalLinks: 3, // لینک‌های داخلی صفحه‌ها در قالب خود صفحه هستند
    });
    return {
      ...t,
      hasContent: Boolean(rec),
      isGenerated: rec?.isGenerated ?? false,
      noindex: rec?.noindex ?? false,
      words,
      score,
      issues,
      metaTitle: rec?.metaTitle ?? null,
      metaDescription: rec?.metaDescription ?? null,
    };
  });

  const status = opts.status ?? "all";
  const filtered = rows.filter((r) => {
    if (status === "missing") return !r.hasContent;
    if (status === "thin") return r.hasContent && r.words < 200;
    if (status === "generated") return r.isGenerated;
    if (status === "manual") return r.hasContent && !r.isGenerated;
    if (status === "noindex") return r.noindex;
    return true;
  });

  // ضعیف‌ترین و پرارزش‌ترین بالا
  return filtered.sort((a, b) => a.score - b.score || b.weight - a.weight);
}

/** خلاصه وضعیت یک نوع صفحه برای داشبورد */
export async function summarize(entityType: SeoEntity) {
  const rows = await listRows(entityType);
  const total = rows.length;
  const withContent = rows.filter((r) => r.hasContent).length;
  const thin = rows.filter((r) => r.hasContent && r.words < 200).length;
  const avg = total ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
  return { entityType, total, withContent, thin, missing: total - withContent, avg };
}

/**
 * پیش‌نمایش زنده: محتوای این صفحه اگر همین حالا از قالب ساخته شود چه می‌شود.
 * برای دکمه «پر کردن از قالب» در ویرایشگر.
 */
export async function previewFromTemplate(
  entityType: SeoEntity,
  entityKey: string,
): Promise<Partial<Record<Slot, string>>> {
  const templates = await getTemplates(entityType);
  if (templates.size === 0) return {};

  let vars: Record<string, string | number | null | undefined> = {};
  if (entityType === "PART") {
    const part = await prisma.part.findUnique({
      where: { id: entityKey },
      include: partVarsInclude,
    });
    if (part) vars = buildPartVars(part);
  } else if (entityType === "CAR_MODEL") {
    vars = await buildModelVars(entityKey);
  } else if (entityType === "CAR_CATEGORY") {
    const [modelId, categoryId] = entityKey.split(":");
    vars = await buildCarCategoryVars(modelId, categoryId);
  } else if (entityType === "CATEGORY") {
    vars = await buildCategoryVars(entityKey);
  }

  const out: Partial<Record<Slot, string>> = {};
  for (const [slot, tpl] of templates) out[slot] = renderTemplate(tpl, vars);
  return out;
}

/** یک هدف را با شناسه‌اش پیدا می‌کند؛ برای صفحه ویرایش */
export async function findTarget(
  entityType: SeoEntity,
  entityKey: string,
): Promise<SeoTarget | null> {
  if (entityType === "PART") {
    const p = await prisma.part.findUnique({
      where: { id: entityKey },
      select: { id: true, slug: true, nameFa: true, titleFa: true },
    });
    if (!p) return null;
    return {
      entityType,
      entityKey,
      label: p.titleFa ?? p.nameFa,
      path: `/part/${encodeURIComponent(p.slug)}`,
      keyword: p.nameFa,
      weight: 1,
    };
  }

  if (entityType === "CAR_MODEL") {
    const m = await prisma.vehicleModel.findUnique({
      where: { id: entityKey },
      include: { make: true },
    });
    if (!m) return null;
    return {
      entityType,
      entityKey,
      label: `لوازم یدکی ${m.nameFa}`,
      path: `/car/${m.make.slug}/${m.slug}`,
      keyword: m.nameFa,
      weight: 0,
    };
  }

  if (entityType === "CAR_CATEGORY") {
    const [modelId, categoryId] = entityKey.split(":");
    const [m, c] = await Promise.all([
      prisma.vehicleModel.findUnique({ where: { id: modelId }, include: { make: true } }),
      prisma.partCategory.findUnique({ where: { id: categoryId } }),
    ]);
    if (!m || !c) return null;
    return {
      entityType,
      entityKey,
      label: `${c.nameFa} ${m.make.nameFa} ${m.nameFa}`,
      path: `/car/${m.make.slug}/${m.slug}/${c.slug}`,
      keyword: `${c.nameFa} ${m.nameFa}`,
      weight: 0,
    };
  }

  if (entityType === "CATEGORY") {
    const c = await prisma.partCategory.findUnique({ where: { id: entityKey } });
    if (!c) return null;
    return {
      entityType,
      entityKey,
      label: c.nameFa,
      path: `/catalog?categoryId=${c.id}`,
      keyword: c.nameFa,
      weight: 0,
    };
  }

  const stat = STATIC_PAGES.find((p) => p.path === entityKey);
  if (!stat) return null;
  return {
    entityType,
    entityKey,
    label: stat.label,
    path: stat.path,
    keyword: stat.label,
    weight: 0,
  };
}
