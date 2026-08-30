import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { faYearRange, faNumber } from "@/lib/format";
import type { SeoVars } from "@/lib/seo-content";

/**
 * جای‌گذارهای هر نوع صفحه و روش ساختنشان از داده.
 *
 * فهرست زیر همان چیزی است که در پنل به کاربر نشان داده می‌شود، پس هر متغیری که
 * اینجا اضافه شود خودکار در راهنمای قالب هم می‌آید.
 */

export type VarDoc = { name: string; hint: string };

export const VAR_DOCS: Record<SeoEntity, VarDoc[]> = {
  PART: [
    { name: "قطعه", hint: "نام قطعه، مثل «لنت ترمز جلو»" },
    { name: "عنوان", hint: "عنوان کامل سئو شامل خودرو" },
    { name: "شماره_فنی", hint: "کد اصلی سازنده" },
    { name: "تعداد_کد", hint: "چند کد معادل دارد" },
    { name: "کدهای_معادل", hint: "فهرست کدهای معادل با ویرگول" },
    { name: "دسته", hint: "دسته قطعه، مثل «ترمز»" },
    { name: "برند_خودرو", hint: "هیوندای یا کیا" },
    { name: "خودرو", hint: "نام مدل خودرو" },
    { name: "نسل", hint: "نسل خودرو، مثل «TL»" },
    { name: "سال", hint: "بازه سال ساخت" },
    { name: "خودروهای_سازگار", hint: "فهرست همه خودروهای سازگار" },
    { name: "تعداد_خودرو", hint: "روی چند خودرو می‌نشیند" },
    { name: "برند_قطعه", hint: "برند سازنده قطعه" },
    { name: "فروشگاه", hint: "نام فروشگاه" },
  ],
  CAR_MODEL: [
    { name: "خودرو", hint: "نام مدل، مثل «توسان»" },
    { name: "برند_خودرو", hint: "هیوندای یا کیا" },
    { name: "تعداد_قطعه", hint: "چند قطعه برای این خودرو داریم" },
    { name: "نسل‌ها", hint: "فهرست نسل‌ها" },
    { name: "سال‌ها", hint: "بازه سال‌های پوشش‌داده‌شده" },
    { name: "دسته‌ها", hint: "دسته‌های پرکاربرد این خودرو" },
    { name: "فروشگاه", hint: "نام فروشگاه" },
  ],
  CAR_CATEGORY: [
    { name: "دسته", hint: "نام دسته، مثل «ترمز»" },
    { name: "خودرو", hint: "نام مدل خودرو" },
    { name: "برند_خودرو", hint: "هیوندای یا کیا" },
    { name: "تعداد_قطعه", hint: "تعداد قطعه این ترکیب" },
    { name: "قطعات_نمونه", hint: "چند نمونه از قطعات این دسته" },
    { name: "فروشگاه", hint: "نام فروشگاه" },
  ],
  CATEGORY: [
    { name: "دسته", hint: "نام دسته" },
    { name: "تعداد_قطعه", hint: "تعداد قطعه این دسته" },
    { name: "فروشگاه", hint: "نام فروشگاه" },
  ],
  PAGE: [
    { name: "عنوان", hint: "عنوان صفحه" },
    { name: "فروشگاه", hint: "نام فروشگاه" },
  ],
};

const STORE = "میثاق یدک";

/** شکل داده‌ای که برای ساخت متغیرهای یک قطعه لازم است */
export const partVarsInclude = {
  category: true,
  brand: true,
  numbers: { orderBy: { isPrimary: "desc" } },
  fitments: {
    include: {
      make: true,
      model: true,
      generation: { include: { model: { include: { make: true } } } },
    },
  },
} as const;

type PartForVars = {
  nameFa: string;
  titleFa: string | null;
  category: { nameFa: string };
  brand: { nameFa: string } | null;
  numbers: Array<{ number: string; isPrimary: boolean }>;
  fitments: Array<{
    yearFrom: number | null;
    yearTo: number | null;
    make: { nameFa: string } | null;
    model: { nameFa: string } | null;
    generation: {
      nameFa: string;
      yearStart: number;
      yearEnd: number | null;
      model: { nameFa: string; make: { nameFa: string } };
    } | null;
  }>;
};

export function buildPartVars(part: PartForVars): SeoVars {
  const primary = part.numbers.find((n) => n.isPrimary) ?? part.numbers[0];
  const others = part.numbers.filter((n) => n.number !== primary?.number);
  const fit = part.fitments[0];

  const makeName = fit?.make?.nameFa ?? fit?.generation?.model.make.nameFa ?? "";
  const modelName = fit?.model?.nameFa ?? fit?.generation?.model.nameFa ?? "";

  const vehicles = part.fitments
    .map((f) =>
      [
        f.make?.nameFa ?? f.generation?.model.make.nameFa,
        f.model?.nameFa ?? f.generation?.model.nameFa,
        f.generation?.nameFa,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .filter((v, i, all) => v && all.indexOf(v) === i);

  const years = fit?.generation
    ? faYearRange(fit.yearFrom ?? fit.generation.yearStart, fit.yearTo ?? fit.generation.yearEnd)
    : "";

  return {
    قطعه: part.nameFa,
    عنوان: part.titleFa ?? part.nameFa,
    شماره_فنی: primary?.number ?? "",
    تعداد_کد: others.length ? faNumber(others.length) : "",
    کدهای_معادل: others.map((n) => n.number).join("، "),
    دسته: part.category.nameFa,
    برند_خودرو: makeName,
    خودرو: modelName,
    نسل: fit?.generation?.nameFa ?? "",
    سال: years,
    خودروهای_سازگار: vehicles.join("، "),
    تعداد_خودرو: vehicles.length ? faNumber(vehicles.length) : "",
    برند_قطعه: part.brand?.nameFa ?? "",
    فروشگاه: STORE,
  };
}

/** متغیرهای صفحه یک مدل خودرو */
export async function buildModelVars(modelId: string): Promise<SeoVars> {
  const model = await prisma.vehicleModel.findUnique({
    where: { id: modelId },
    include: { make: true, generations: { orderBy: { yearStart: "asc" } } },
  });
  if (!model) return { فروشگاه: STORE };

  const total = await prisma.part.count({
    where: { isActive: true, fitments: { some: { generation: { modelId } } } },
  });

  const cats = await prisma.part.findMany({
    where: { isActive: true, fitments: { some: { generation: { modelId } } } },
    select: { category: { select: { nameFa: true, slug: true } } },
    take: 3000,
  });
  const catNames = [...new Set(cats.map((c) => c.category.nameFa))]
    .filter((n) => n !== "دسته‌بندی نشده")
    .slice(0, 8);

  const gens = model.generations;
  const startYear = Math.min(...gens.map((g) => g.yearStart));
  const endYears = gens.map((g) => g.yearEnd);

  return {
    خودرو: model.nameFa,
    برند_خودرو: model.make.nameFa,
    تعداد_قطعه: faNumber(total),
    "نسل‌ها": gens.map((g) => `${g.nameFa} (${faYearRange(g.yearStart, g.yearEnd)})`).join("، "),
    "سال‌ها": gens.length
      ? faYearRange(startYear, endYears.some((y) => y === null) ? null : Math.max(...(endYears as number[])))
      : "",
    "دسته‌ها": catNames.join("، "),
    فروشگاه: STORE,
  };
}

/** متغیرهای ترکیب دسته × خودرو */
export async function buildCarCategoryVars(
  modelId: string,
  categoryId: string,
): Promise<SeoVars> {
  const [model, category] = await Promise.all([
    prisma.vehicleModel.findUnique({ where: { id: modelId }, include: { make: true } }),
    prisma.partCategory.findUnique({ where: { id: categoryId } }),
  ]);
  if (!model || !category) return { فروشگاه: STORE };

  const where = {
    isActive: true,
    categoryId,
    fitments: { some: { generation: { modelId } } },
  } as const;

  const [total, samples] = await Promise.all([
    prisma.part.count({ where }),
    prisma.part.findMany({ where, select: { nameFa: true }, take: 6 }),
  ]);

  return {
    دسته: category.nameFa,
    خودرو: model.nameFa,
    برند_خودرو: model.make.nameFa,
    تعداد_قطعه: faNumber(total),
    قطعات_نمونه: [...new Set(samples.map((s) => s.nameFa))].join("، "),
    فروشگاه: STORE,
  };
}

/** متغیرهای صفحه یک دسته */
export async function buildCategoryVars(categoryId: string): Promise<SeoVars> {
  const category = await prisma.partCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { فروشگاه: STORE };
  const total = await prisma.part.count({ where: { isActive: true, categoryId } });
  return { دسته: category.nameFa, تعداد_قطعه: faNumber(total), فروشگاه: STORE };
}
