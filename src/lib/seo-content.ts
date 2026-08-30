import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * موتور محتوای سئو.
 *
 * هر صفحه‌ای که برای گوگل مهم است — قطعه، خودرو، ترکیب دسته×خودرو، دسته و
 * صفحه‌های ثابت — می‌تواند عنوان، توضیح متا و دو بلوک متن داشته باشد.
 *
 * دو منبع دارد و به همین ترتیب اولویت دارند:
 *   ۱. متن دستی که در پنل نوشته شده (SeoContent)
 *   ۲. قالب فعال همان جایگاه که با داده همان صفحه پر می‌شود (ContentTemplate)
 *
 * جای‌گذارها فارسی‌اند تا کسی که پنل را استفاده می‌کند بدون دانش فنی بتواند
 * قالب بنویسد: {{قطعه}} {{خودرو}} {{شماره_فنی}} …
 */

export type Slot = "metaTitle" | "metaDescription" | "h1" | "intro" | "body";

export const SLOT_LABEL: Record<Slot, string> = {
  metaTitle: "عنوان صفحه",
  metaDescription: "توضیح متا",
  h1: "تیتر اصلی",
  intro: "متن بالای صفحه",
  body: "متن بلند پایین صفحه",
};

export const ENTITY_LABEL: Record<SeoEntity, string> = {
  PART: "صفحه قطعه",
  CAR_MODEL: "صفحه خودرو",
  CAR_CATEGORY: "دسته × خودرو",
  CATEGORY: "صفحه دسته",
  PAGE: "صفحه ثابت",
};

/** طول پیشنهادی گوگل برای هر جایگاه؛ مبنای هشدارهای پنل */
export const SLOT_LIMITS: Record<Slot, { min: number; max: number }> = {
  metaTitle: { min: 25, max: 60 },
  metaDescription: { min: 70, max: 158 },
  h1: { min: 10, max: 80 },
  intro: { min: 80, max: 400 },
  body: { min: 300, max: 20_000 },
};

export type SeoVars = Record<string, string | number | null | undefined>;

/**
 * جای‌گذاری متغیرها در قالب.
 * شرط ساده هم پشتیبانی می‌شود تا وقتی داده‌ای نیست، جمله ناقص جا نماند:
 *   {{#اگر شماره_فنی}}با کد {{شماره_فنی}}{{/اگر}}
 */
export function renderTemplate(template: string, vars: SeoVars): string {
  const value = (name: string) => {
    const raw = vars[name.trim()];
    return raw === null || raw === undefined ? "" : String(raw).trim();
  };

  return template
    .replace(/\{\{#اگر\s+([^}]+)\}\}([\s\S]*?)\{\{\/اگر\}\}/g, (_m, name, inner) =>
      value(name) ? inner : "",
    )
    .replace(/\{\{([^#/][^}]*)\}\}/g, (_m, name) => value(name))
    // خط خالی سه‌تایی که از حذف شرط‌ها می‌ماند جمع شود
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export type ResolvedSeo = {
  metaTitle: string | null;
  metaDescription: string | null;
  h1: string | null;
  intro: string | null;
  body: string | null;
  noindex: boolean;
  /** کدام جایگاه‌ها دستی نوشته شده‌اند */
  manual: Set<Slot>;
};

const EMPTY: ResolvedSeo = {
  metaTitle: null,
  metaDescription: null,
  h1: null,
  intro: null,
  body: null,
  noindex: false,
  manual: new Set(),
};

/** قالب‌های فعال یک نوع صفحه، بر اساس جایگاه */
export async function getTemplates(entityType: SeoEntity) {
  const rows = await prisma.contentTemplate.findMany({
    where: { entityType, isActive: true },
  });
  const map = new Map<Slot, string>();
  for (const row of rows) map.set(row.slot as Slot, row.template);
  return map;
}

export async function getSeoRecord(entityType: SeoEntity, entityKey: string) {
  return prisma.seoContent.findUnique({
    where: { entityType_entityKey: { entityType, entityKey } },
  });
}

/**
 * محتوای نهایی یک صفحه: متن دستی، وگرنه قالب، وگرنه خالی.
 * صفحه‌های سایت فقط همین را صدا می‌زنند.
 */
export async function resolveSeo(
  entityType: SeoEntity,
  entityKey: string,
  vars: SeoVars,
): Promise<ResolvedSeo> {
  const [record, templates] = await Promise.all([
    getSeoRecord(entityType, entityKey),
    getTemplates(entityType),
  ]);

  if (!record && templates.size === 0) return EMPTY;

  const manual = new Set<Slot>();
  const pick = (slot: Slot): string | null => {
    const stored = record?.[slot];
    if (stored && String(stored).trim()) {
      manual.add(slot);
      return String(stored).trim();
    }
    const tpl = templates.get(slot);
    if (!tpl) return null;
    const rendered = renderTemplate(tpl, vars);
    return rendered || null;
  };

  return {
    metaTitle: pick("metaTitle"),
    metaDescription: pick("metaDescription"),
    h1: pick("h1"),
    intro: pick("intro"),
    body: pick("body"),
    noindex: record?.noindex ?? false,
    manual,
  };
}

/** شمارش کلمه فارسی — مبنای هشدار «محتوای نازک» */
export function wordCount(text?: string | null): number {
  if (!text) return 0;
  return text
    .replace(/[#*>`\-|]/g, " ")
    .split(/[\s‌]+/)
    .filter((w) => w.length > 1).length;
}

/**
 * امتیاز سئوی یک صفحه از صد.
 * وزن‌ها از چیزی می‌آید که واقعاً در نتایج گوگل اثر دارد: عنوان و توضیح متا
 * بیشترین سهم، بعد حجم محتوای یکتا، بعد لینک داخلی و کلیدواژه در عنوان.
 */
export function scoreSeo(input: {
  metaTitle?: string | null;
  metaDescription?: string | null;
  intro?: string | null;
  body?: string | null;
  keyword?: string | null;
  internalLinks?: number;
}): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;

  const title = input.metaTitle?.trim() ?? "";
  if (!title) issues.push("عنوان صفحه خالی است");
  else if (title.length > SLOT_LIMITS.metaTitle.max)
    issues.push(`عنوان ${title.length} کاراکتر است؛ گوگل بعد از ۶۰ کاراکتر را می‌برد`);
  else if (title.length < SLOT_LIMITS.metaTitle.min)
    issues.push("عنوان خیلی کوتاه است و کلیدواژه کافی ندارد");
  else score += 25;

  const desc = input.metaDescription?.trim() ?? "";
  if (!desc) issues.push("توضیح متا نوشته نشده؛ گوگل خودش یک تکه از متن را برمی‌دارد");
  else if (desc.length > SLOT_LIMITS.metaDescription.max)
    issues.push(`توضیح متا ${desc.length} کاراکتر است؛ بیشتر از ۱۵۸ کاراکتر بریده می‌شود`);
  else if (desc.length < SLOT_LIMITS.metaDescription.min)
    issues.push("توضیح متا کوتاه است و فضای جذب کلیک را هدر می‌دهد");
  else score += 25;

  const words = wordCount(input.intro) + wordCount(input.body);
  if (words >= 400) score += 30;
  else if (words >= 200) score += 20;
  else if (words >= 80) score += 10;
  if (words < 200) issues.push(`محتوای یکتا ${words} کلمه است؛ رقیب حدود ۸۰۰ کلمه دارد`);

  const kw = input.keyword?.trim();
  if (kw) {
    if (title.includes(kw)) score += 10;
    else issues.push(`کلیدواژه «${kw}» در عنوان نیست`);
  } else {
    score += 10;
  }

  const links = input.internalLinks ?? 0;
  if (links >= 3) score += 10;
  else issues.push("لینک داخلی کم است؛ حداقل سه لینک به صفحه‌های مرتبط بگذارید");

  return { score: Math.min(100, score), issues };
}

/** رنگ نشانگر امتیاز */
export function scoreTone(score: number): "ok" | "warn" | "bad" {
  if (score >= 80) return "ok";
  if (score >= 50) return "warn";
  return "bad";
}
