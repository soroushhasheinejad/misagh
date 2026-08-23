import { prisma } from "@/lib/prisma";
import { getSettings, type Settings } from "@/lib/settings";
import {
  computePrice,
  assignBadges,
  type PriceConfig,
  type PriceResult,
  type OfferBadge,
} from "@/lib/pricing";
import { normalizePartNumber, normalizeFa } from "@/lib/normalize";
import type { Prisma } from "@prisma/client";

type Decimalish = Prisma.Decimal | number | null | undefined;

function num(value: Decimalish): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

/** فیلدهای قیمتی رکورد دیتابیس را به ورودی موتور قیمت تبدیل می‌کند. */
function toPriceConfig(row: Record<string, unknown> | null | undefined): PriceConfig | null {
  if (!row) return null;
  const r = row as Record<string, never>;
  return {
    priceMode: r.priceMode ?? null,
    basePriceIrr: num(r.basePriceIrr),
    baseCurrencyCode: r.baseCurrencyCode ?? null,
    basePriceForeign: num(r.basePriceForeign),
    marginPercent: num(r.marginPercent),
    discountPercent: num(r.discountPercent),
    discountUntil: r.discountUntil ?? null,
    roundingRule: r.roundingRule ?? null,
    priceLocked: r.priceLocked ?? null,
    lockedPriceIrr: num(r.lockedPriceIrr),
    priceValidUntil: r.priceValidUntil ?? null,
    showPrice: r.showPrice ?? null,
    allowInquiry: r.allowInquiry ?? null,
    dealerPriceIrr: num(r.dealerPriceIrr),
    dealerMargin: num(r.dealerMargin),
    minOrderQty: (r.minOrderQty as number | null) ?? null,
  };
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  const currencies = await prisma.currency.findMany();
  return Object.fromEntries(currencies.map((c) => [c.code, Number(c.rateIrr)]));
}

// ------------------------------ کاتالوگ خودرو -------------------------------

export function getMakes() {
  return prisma.vehicleMake.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function getModels(makeId: string) {
  return prisma.vehicleModel.findMany({
    where: { makeId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function getGenerations(modelId: string) {
  return prisma.vehicleGeneration.findMany({
    where: { modelId, isActive: true },
    orderBy: { yearStart: "desc" },
  });
}

export function getTrims(generationId: string) {
  return prisma.vehicleTrim.findMany({
    where: { generationId, isActive: true },
    orderBy: { nameFa: "asc" },
  });
}

export function getCategoryTree() {
  return prisma.partCategory.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

// ------------------------------ قیمت‌گذاری ----------------------------------

export type PricedOffer = {
  id: string;
  sku: string | null;
  brandName: string | null;
  qualityTier: string | null;
  supplierName: string | null;
  stockQty: number;
  leadTimeDays: number;
  isDefault: boolean;
  price: PriceResult;
  badges: OfferBadge[];
};

type OfferRow = Prisma.OfferGetPayload<{ include: { brand: true; supplier: true } }>;
type PartRow = Prisma.PartGetPayload<Record<string, never>>;

/** قیمت همه پیشنهادهای یک قطعه را با ارث‌بری قطعه ← تنظیمات محاسبه می‌کند. */
export async function priceOffers(
  part: PartRow,
  offers: OfferRow[],
  opts: { settings?: Settings; rates?: Record<string, number>; isDealer?: boolean } = {},
): Promise<PricedOffer[]> {
  const settings = opts.settings ?? (await getSettings());
  const rates = opts.rates ?? (await getExchangeRates());
  const partConfig = toPriceConfig(part);

  const priced = offers.map((offer) => ({
    id: offer.id,
    sku: offer.sku,
    brandName: offer.brand?.nameFa ?? null,
    qualityTier: offer.brand?.qualityTier ?? null,
    supplierName: settings["offers.showSupplierName"] ? (offer.supplier?.name ?? null) : null,
    stockQty: offer.stockQty,
    leadTimeDays: offer.leadTimeDays,
    isDefault: offer.isDefault,
    price: computePrice({
      offer: toPriceConfig(offer),
      part: partConfig,
      settings,
      rates,
      isDealer: opts.isDealer,
      stockQty: offer.stockQty,
    }),
  }));

  const badgeMap = settings["offers.showBadges"] ? assignBadges(priced) : new Map();
  const withBadges = priced.map((o) => ({ ...o, badges: badgeMap.get(o.id) ?? [] }));

  // اگر «چند پیشنهادی» خاموش باشد فقط پیشنهاد پیش‌فرض (یا بهترین) نمایش داده می‌شود
  if (!settings["offers.multiOfferEnabled"]) {
    const chosen =
      withBadges.find((o) => o.isDefault) ??
      withBadges.find((o) => o.price.kind === "price") ??
      withBadges[0];
    return chosen ? [chosen] : [];
  }

  const order = settings["offers.sortBy"];
  return [...withBadges].sort((a, b) => {
    if (order === "price") {
      const pa = a.price.kind === "price" ? a.price.amountIrr : Number.MAX_SAFE_INTEGER;
      const pb = b.price.kind === "price" ? b.price.amountIrr : Number.MAX_SAFE_INTEGER;
      return pa - pb;
    }
    if (order === "lead") return a.leadTimeDays - b.leadTimeDays;
    return Number(b.isDefault) - Number(a.isDefault) || a.leadTimeDays - b.leadTimeDays;
  });
}

// -------------------------------- جستجو ------------------------------------

export type OemMatch = {
  matchedNumber: string;
  matchType: "exact" | "cross" | "superseded" | "partial";
  part: PartRow & { images: { url: string; alt: string | null }[] };
  offers: PricedOffer[];
  numbers: { number: string; type: string; brandName: string | null }[];
};

export type OemSearchResult = {
  query: string;
  normalized: string;
  directCount: number;
  equivalentCount: number;
  matches: OemMatch[];
};

/**
 * جستجوی شماره فنی به سبک fitinpart:
 * کد را پیدا می‌کند، بعد از طریق گروه معادل‌ها و جدول جایگزینی
 * همه کدهای هم‌ارز و قطعاتشان را هم برمی‌گرداند.
 */
export async function searchByOem(rawQuery: string): Promise<OemSearchResult> {
  const normalized = normalizePartNumber(rawQuery);
  const settings = await getSettings();
  const rates = await getExchangeRates();

  if (normalized.length < 3) {
    return { query: rawQuery, normalized, directCount: 0, equivalentCount: 0, matches: [] };
  }

  const direct = await prisma.partNumber.findMany({
    where: {
      OR: [{ normalized }, { normalized: { startsWith: normalized } }],
    },
    include: { crossMembers: true, supersedes: true, supersededBy: true },
    take: 50,
  });

  const partIds = new Map<string, OemMatch["matchType"]>();
  for (const n of direct) {
    partIds.set(n.partId, n.normalized === normalized ? "exact" : "partial");
  }

  let equivalentCount = 0;

  if (settings["search.crossReferenceEnabled"] && direct.length > 0) {
    const groupIds = direct.flatMap((n) => n.crossMembers.map((m) => m.groupId));
    if (groupIds.length > 0) {
      const members = await prisma.crossGroupMember.findMany({
        where: { groupId: { in: groupIds } },
        include: { partNumber: true },
      });
      equivalentCount = members.length;
      for (const m of members) {
        if (!partIds.has(m.partNumber.partId)) partIds.set(m.partNumber.partId, "cross");
      }
    }

    // کدهای جایگزین‌شده
    const supersessionIds = direct.flatMap((n) => [
      ...n.supersedes.map((s) => s.fromId),
      ...n.supersededBy.map((s) => s.toId),
    ]);
    if (supersessionIds.length > 0) {
      const superseded = await prisma.partNumber.findMany({
        where: { id: { in: supersessionIds } },
      });
      for (const s of superseded) {
        if (!partIds.has(s.partId)) partIds.set(s.partId, "superseded");
      }
    }
  }

  const parts = await prisma.part.findMany({
    where: { id: { in: [...partIds.keys()], }, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      numbers: { include: { brand: true } },
      offers: {
        where: { status: { not: "DISABLED" } },
        include: { brand: true, supplier: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const matches: OemMatch[] = [];
  for (const part of parts) {
    const primary = part.numbers.find((n) => n.isPrimary) ?? part.numbers[0];
    matches.push({
      matchedNumber: primary?.number ?? normalized,
      matchType: partIds.get(part.id) ?? "cross",
      part,
      offers: await priceOffers(part, part.offers, { settings, rates }),
      numbers: part.numbers.map((n) => ({
        number: n.number,
        type: n.type,
        brandName: n.brand?.nameFa ?? null,
      })),
    });
  }

  matches.sort((a, b) => {
    const rank = { exact: 0, superseded: 1, cross: 2, partial: 3 };
    return rank[a.matchType] - rank[b.matchType];
  });

  if (settings["search.logZeroResults"]) {
    await prisma.searchLog.create({
      data: {
        query: rawQuery,
        normalized,
        resultCount: matches.length,
        searchType: "oem",
      },
    });
  }

  return {
    query: rawQuery,
    normalized,
    directCount: direct.length,
    equivalentCount,
    matches,
  };
}

/** قطعات سازگار با یک خودرو */
export const PAGE_SIZE = 24;

export async function searchByVehicle(params: {
  generationId?: string;
  trimId?: string;
  categoryId?: string;
  page?: number;
}) {
  const { generationId, trimId, categoryId, page = 1 } = params;
  const where: Prisma.PartWhereInput = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    fitments: {
      some: {
        ...(trimId ? { OR: [{ trimId }, { trimId: null, generationId }] } : {}),
        ...(!trimId && generationId ? { generationId } : {}),
      },
    },
  };

  const total = await prisma.part.count({ where });
  const parts = await prisma.part.findMany({
    where,
    orderBy: [{ categoryId: "asc" }, { nameFa: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      numbers: { where: { isPrimary: true }, take: 1 },
      offers: {
        where: { status: { not: "DISABLED" } },
        include: { brand: true, supplier: true },
      },
      category: true,
    },
  });

  const settings = await getSettings();
  const rates = await getExchangeRates();

  const items = await Promise.all(
    parts.map(async (p) => ({
      part: p,
      offers: await priceOffers(p, p.offers, { settings, rates }),
    })),
  );

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getPartBySlug(slug: string) {
  const part = await prisma.part.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      numbers: { include: { brand: true } },
      offers: {
        where: { status: { not: "DISABLED" } },
        include: { brand: true, supplier: true },
        orderBy: { sortOrder: "asc" },
      },
      fitments: {
        include: { make: true, model: true, generation: true, trim: true },
      },
    },
  });
  if (!part) return null;

  const offers = await priceOffers(part, part.offers);
  return { part, offers };
}

// --------------------------- صفحه محصولات -----------------------------------

export type PartSort = "newest" | "name" | "cheapest" | "expensive";

export type SearchPartsParams = {
  q?: string;
  categoryId?: string;
  generationId?: string;
  trimId?: string;
  brandId?: string;
  inStock?: boolean;
  hasPrice?: boolean;
  sort?: PartSort;
  page?: number;
};

/** دسته و همه زیردسته‌هایش — انتخاب «ترمز» باید لنت و دیسک را هم بیاورد */
async function categoryWithChildren(categoryId: string): Promise<string[]> {
  const children = await prisma.partCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  return [categoryId, ...children.map((c) => c.id)];
}

function buildWhere(
  params: SearchPartsParams,
  categoryIds: string[] | null,
): Prisma.PartWhereInput {
  const { q, generationId, trimId, brandId, inStock, hasPrice } = params;

  const filters: Prisma.PartWhereInput[] = [{ isActive: true }];

  if (categoryIds) filters.push({ categoryId: { in: categoryIds } });

  if (q && q.trim()) {
    const text = normalizeFa(q);
    const asNumber = normalizePartNumber(q);

    // جستجو باید واژه‌ای باشد نه زیررشته‌ای: «لنت» نباید داخل «النترا» پیدا شود.
    // پس یا ابتدای نام است، یا بعد از فاصله یا نیم‌فاصله می‌آید.
    const wordStarts = (needle: string): Prisma.PartWhereInput[] => [
      { nameFa: { startsWith: needle, mode: "insensitive" } },
      { nameFa: { contains: ` ${needle}`, mode: "insensitive" } },
      { nameFa: { contains: `‌${needle}`, mode: "insensitive" } },
      { nameFa: { contains: `(${needle}`, mode: "insensitive" } },
    ];

    const needles = [...new Set([q.trim(), text])].filter((n) => n.length > 0);

    filters.push({
      OR: [
        ...needles.flatMap(wordStarts),
        ...(asNumber.length >= 3
          ? [{ numbers: { some: { normalized: { startsWith: asNumber } } } }]
          : []),
      ],
    });
  }

  if (generationId || trimId) {
    filters.push({
      fitments: {
        some: trimId
          ? { OR: [{ trimId }, { trimId: null, generationId }] }
          : { generationId },
      },
    });
  }

  if (brandId) {
    filters.push({ OR: [{ brandId }, { offers: { some: { brandId } } }] });
  }

  if (inStock) {
    filters.push({ offers: { some: { status: "ACTIVE", stockQty: { gt: 0 } } } });
  }

  if (hasPrice) {
    filters.push({
      offers: { some: { status: { not: "DISABLED" }, basePriceIrr: { not: null } } },
    });
  }

  return { AND: filters };
}

const PART_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  numbers: { where: { isPrimary: true }, take: 1 },
  offers: {
    where: { status: { not: "DISABLED" as const } },
    include: { brand: true, supplier: true },
  },
};

/**
 * جستجوی صفحه محصولات — همه فیلترها با هم ترکیب می‌شوند.
 * مرتب‌سازی بر اساس قیمت چون به کمترین قیمت پیشنهادها وابسته است،
 * اول شناسه‌ها را با groupBy مرتب می‌کند و بعد قطعات را می‌خواند.
 */
export async function searchParts(params: SearchPartsParams) {
  const page = Math.max(1, params.page ?? 1);
  const sort: PartSort = params.sort ?? "newest";
  const categoryIds = params.categoryId ? await categoryWithChildren(params.categoryId) : null;
  const where = buildWhere(params, categoryIds);

  const settings = await getSettings();
  const rates = await getExchangeRates();

  let parts: Prisma.PartGetPayload<{ include: typeof PART_INCLUDE }>[];
  let total: number;

  if (sort === "cheapest" || sort === "expensive") {
    // فقط قطعاتی که قیمت پایه دارند قابل مرتب‌سازی قیمتی‌اند
    const candidates = await prisma.part.findMany({
      where: {
        AND: [
          where,
          { offers: { some: { status: { not: "DISABLED" }, basePriceIrr: { not: null } } } },
        ],
      },
      select: { id: true },
    });
    const ids = candidates.map((c) => c.id);
    total = ids.length;

    const grouped = ids.length
      ? await prisma.offer.groupBy({
          by: ["partId"],
          where: { partId: { in: ids }, status: { not: "DISABLED" }, basePriceIrr: { not: null } },
          _min: { basePriceIrr: true },
          orderBy: { _min: { basePriceIrr: sort === "cheapest" ? "asc" : "desc" } },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        })
      : [];

    const pageIds = grouped.map((g) => g.partId);
    const found = await prisma.part.findMany({
      where: { id: { in: pageIds } },
      include: PART_INCLUDE,
    });
    // ترتیب groupBy را نگه می‌داریم
    const byId = new Map(found.map((p) => [p.id, p]));
    parts = pageIds.map((id) => byId.get(id)!).filter(Boolean);
  } else {
    total = await prisma.part.count({ where });
    parts = await prisma.part.findMany({
      where,
      orderBy: sort === "name" ? { nameFa: "asc" } : { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: PART_INCLUDE,
    });
  }

  const items = await Promise.all(
    parts.map(async (p) => ({
      part: p,
      offers: await priceOffers(p, p.offers, { settings, rates }),
    })),
  );

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** برندهایی که واقعاً روی پیشنهادها استفاده شده‌اند */
export async function getUsedBrands() {
  const brands = await prisma.partBrand.findMany({
    where: { isActive: true, offers: { some: {} } },
    orderBy: { nameFa: "asc" },
    include: { _count: { select: { offers: true } } },
  });
  return brands;
}

// ------------------- کمک به جستجوی شماره فنی بی‌نتیجه -----------------------

/**
 * وقتی کد پیدا نشد: قطعات هم‌گروه را پیشنهاد می‌دهد.
 * پنج رقم اول شماره فنی نوع قطعه است، پس 58101-XXXXX یعنی «لنت جلو»؛
 * حتی اگر آن کد خاص را نداشته باشیم، لنت جلوهای دیگر را نشان می‌دهیم.
 */
export async function suggestSameGroup(rawQuery: string, take = 6) {
  const normalized = normalizePartNumber(rawQuery);
  if (normalized.length < 5 || !/^\d{5}/.test(normalized)) return [];

  const prefix = normalized.slice(0, 5);
  const numbers = await prisma.partNumber.findMany({
    where: { normalized: { startsWith: prefix } },
    include: {
      part: {
        include: {
          category: true,
          numbers: { where: { isPrimary: true }, take: 1 },
          offers: {
            where: { status: { not: "DISABLED" } },
            include: { brand: true, supplier: true },
          },
          fitments: {
            take: 1,
            include: { generation: { include: { model: { include: { make: true } } } } },
          },
        },
      },
    },
    take: take * 3,
  });

  const settings = await getSettings();
  const rates = await getExchangeRates();

  const seen = new Set<string>();
  const unique = numbers.filter((n) => {
    if (seen.has(n.partId) || !n.part.isActive) return false;
    seen.add(n.partId);
    return true;
  });

  return Promise.all(
    unique.slice(0, take).map(async (n) => ({
      part: n.part,
      offers: await priceOffers(n.part, n.part.offers, { settings, rates }),
      vehicle: n.part.fitments[0]?.generation
        ? `${n.part.fitments[0].generation.model.make.nameFa} ${n.part.fitments[0].generation.model.nameFa} ${n.part.fitments[0].generation.nameFa}`
        : null,
    })),
  );
}

/** پرتکرارترین جستجوهای موفق — برای صفحه خالی جستجو */
export async function getPopularSearches(take = 8) {
  // گروه‌بندی روی شکل نرمال‌شده، وگرنه «58101-D3A00» و «58101D3A00» دو ردیف می‌شوند
  const rows = await prisma.searchLog.groupBy({
    by: ["normalized"],
    where: { searchType: "oem", resultCount: { gt: 0 }, normalized: { not: "" } },
    _count: true,
    orderBy: { _count: { normalized: "desc" } },
    take,
  });
  return rows.map((r) => ({ query: r.normalized, count: r._count }));
}
