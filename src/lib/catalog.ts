import { prisma } from "@/lib/prisma";
import { getSettings, type Settings } from "@/lib/settings";
import {
  computePrice,
  assignBadges,
  type PriceConfig,
  type PriceResult,
  type OfferBadge,
} from "@/lib/pricing";
import { normalizePartNumber } from "@/lib/normalize";
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
export async function searchByVehicle(params: {
  generationId?: string;
  trimId?: string;
  categoryId?: string;
}) {
  const { generationId, trimId, categoryId } = params;
  const parts = await prisma.part.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      fitments: {
        some: {
          ...(trimId ? { OR: [{ trimId }, { trimId: null, generationId }] } : {}),
          ...(!trimId && generationId ? { generationId } : {}),
        },
      },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      numbers: { where: { isPrimary: true }, take: 1 },
      offers: {
        where: { status: { not: "DISABLED" } },
        include: { brand: true, supplier: true },
      },
      category: true,
    },
    take: 60,
  });

  const settings = await getSettings();
  const rates = await getExchangeRates();

  return Promise.all(
    parts.map(async (p) => ({
      part: p,
      offers: await priceOffers(p, p.offers, { settings, rates }),
    })),
  );
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
