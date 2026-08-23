import type { Settings } from "@/lib/settings";

/**
 * موتور قیمت‌گذاری.
 *
 * ترتیب اولویت هر تنظیم: پیشنهاد (Offer) ← قطعه (Part) ← تنظیمات کلی فروشگاه.
 * یعنی هر چیزی را می‌شود در سطح یک پیشنهاد خاص override کرد و اگر خالی بماند
 * از قطعه و در نهایت از تنظیمات فروشگاه ارث می‌برد.
 *
 * همه مبالغ ورودی و خروجی به ریال‌اند.
 */

export type PriceMode = "FIXED" | "CURRENCY_LINKED" | "INQUIRY" | "HIDDEN";
export type RoundingRule =
  | "NONE"
  | "NEAREST_1K"
  | "NEAREST_10K"
  | "NEAREST_100K"
  | "UP_10K"
  | "UP_100K";

/** فیلدهای قیمتی مشترک بین Part و Offer */
export type PriceConfig = {
  priceMode?: PriceMode | null;
  basePriceIrr?: number | null;
  baseCurrencyCode?: string | null;
  basePriceForeign?: number | null;
  marginPercent?: number | null;
  discountPercent?: number | null;
  discountUntil?: Date | null;
  roundingRule?: RoundingRule | null;
  priceLocked?: boolean | null;
  lockedPriceIrr?: number | null;
  priceValidUntil?: Date | null;
  showPrice?: boolean | null;
  allowInquiry?: boolean | null;
  dealerPriceIrr?: number | null;
  dealerMargin?: number | null;
  minOrderQty?: number | null;
};

export type PriceResult =
  | {
      kind: "price";
      amountIrr: number;
      /** قیمت پیش از تخفیف، اگر تخفیف فعال بوده */
      originalIrr?: number;
      discountPercent?: number;
      /** قیمت تا این زمان معتبر است */
      validUntil?: Date;
      basis: "fixed" | "currency" | "locked" | "dealer";
      currency?: { code: string; rateIrr: number; foreignAmount: number };
      minOrderQty: number;
    }
  | { kind: "inquiry"; reason: "mode" | "no-price" | "out-of-stock" }
  | { kind: "hidden"; reason: "mode" | "disabled-globally" | "part-hidden" };

type Layer = PriceConfig | null | undefined;

function pick<K extends keyof PriceConfig>(key: K, ...layers: Layer[]): PriceConfig[K] {
  for (const layer of layers) {
    const value = layer?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

export function round(amount: number, rule: RoundingRule): number {
  switch (rule) {
    case "NEAREST_1K":
      return Math.round(amount / 1_000) * 1_000;
    case "NEAREST_10K":
      return Math.round(amount / 10_000) * 10_000;
    case "NEAREST_100K":
      return Math.round(amount / 100_000) * 100_000;
    case "UP_10K":
      return Math.ceil(amount / 10_000) * 10_000;
    case "UP_100K":
      return Math.ceil(amount / 100_000) * 100_000;
    default:
      return Math.round(amount);
  }
}

export type ComputeArgs = {
  /** تنظیمات قیمتی پیشنهاد — بالاترین اولویت */
  offer?: PriceConfig | null;
  /** تنظیمات قیمتی قطعه */
  part?: PriceConfig | null;
  settings: Settings;
  /** نرخ ارزها: کد ارز به نرخ ریالی */
  rates: Record<string, number>;
  /** مشتری همکار است؟ */
  isDealer?: boolean;
  /** موجودی این پیشنهاد */
  stockQty?: number;
  now?: Date;
};

export function computePrice(args: ComputeArgs): PriceResult {
  const { offer, part, settings, rates, isDealer = false, stockQty, now = new Date() } = args;

  // ۱) قیمت در کل سایت خاموش است؟
  if (settings["pricing.enabled"] === false) {
    return { kind: "hidden", reason: "disabled-globally" };
  }

  // ۲) نمایش قیمت برای این قطعه یا پیشنهاد خاموش شده؟
  const showPrice = pick("showPrice", offer, part) ?? true;
  if (!showPrice) return { kind: "hidden", reason: "part-hidden" };

  const mode = (pick("priceMode", offer, part) ??
    settings["pricing.defaultMode"]) as PriceMode;

  if (mode === "HIDDEN") return { kind: "hidden", reason: "mode" };
  if (mode === "INQUIRY") return { kind: "inquiry", reason: "mode" };

  const rounding = (pick("roundingRule", offer, part) ??
    settings["pricing.defaultRounding"]) as RoundingRule;
  const minOrderQty = pick("minOrderQty", offer, part) ?? 1;

  // ۳) پایه قیمت
  let base: number | undefined;
  let basis: "fixed" | "currency" | "locked" | "dealer" = "fixed";
  let currencyInfo: { code: string; rateIrr: number; foreignAmount: number } | undefined;

  const locked = pick("priceLocked", offer, part) ?? false;
  const lockedPrice = pick("lockedPriceIrr", offer, part);

  // قیمت قفل‌شده، قیمت نهایی فروش است: نه نرخ ارز رویش اثر دارد، نه حاشیه سود.
  if (locked && lockedPrice) {
    let validUntilLocked = pick("priceValidUntil", offer, part) ?? undefined;
    if (!validUntilLocked && settings["pricing.showPriceValidity"]) {
      const hours = Number(settings["pricing.validityHours"] ?? 0);
      if (hours > 0) validUntilLocked = new Date(now.getTime() + hours * 3_600_000);
    }
    return {
      kind: "price",
      amountIrr: round(Number(lockedPrice), rounding),
      ...(validUntilLocked ? { validUntil: new Date(validUntilLocked) } : {}),
      basis: "locked",
      minOrderQty,
    };
  }

  if (mode === "CURRENCY_LINKED") {
    const code = pick("baseCurrencyCode", offer, part) ?? settings["pricing.defaultCurrency"];
    const foreign = pick("basePriceForeign", offer, part);
    const rate = rates[code];
    if (foreign != null && rate) {
      base = Number(foreign) * rate;
      basis = "currency";
      currencyInfo = { code, rateIrr: rate, foreignAmount: Number(foreign) };
    } else {
      // قیمت ارزی ثبت نشده — به قیمت ثابت برمی‌گردیم و اگر آن هم نبود استعلام
      const fixed = pick("basePriceIrr", offer, part);
      if (fixed != null) {
        base = Number(fixed);
        basis = "fixed";
      }
    }
  } else {
    const fixed = pick("basePriceIrr", offer, part);
    if (fixed != null) base = Number(fixed);
  }

  if (base == null) {
    const allowInquiry = pick("allowInquiry", offer, part) ?? settings["inquiry.enabled"];
    return allowInquiry
      ? { kind: "inquiry", reason: "no-price" }
      : { kind: "hidden", reason: "part-hidden" };
  }

  // ۴) حاشیه سود — قیمت همکار مسیر جدا دارد
  if (isDealer && settings["dealer.enabled"]) {
    const dealerFixed = pick("dealerPriceIrr", offer, part);
    if (dealerFixed != null) {
      return {
        kind: "price",
        amountIrr: round(Number(dealerFixed), rounding),
        basis: "dealer",
        minOrderQty,
        ...(currencyInfo ? { currency: currencyInfo } : {}),
      };
    }
    const dealerMargin =
      pick("dealerMargin", offer, part) ?? settings["dealer.defaultMarginPercent"];
    base = base * (1 + Number(dealerMargin) / 100);
    basis = "dealer";
  } else {
    const margin = pick("marginPercent", offer, part) ?? settings["pricing.defaultMarginPercent"];
    base = base * (1 + Number(margin) / 100);
  }

  // ۵) مالیات بر ارزش افزوده، اگر فعال باشد
  const vat = Number(settings["pricing.vatPercent"] ?? 0);
  if (vat > 0) base = base * (1 + vat / 100);

  const originalBeforeDiscount = round(base, rounding);

  // ۶) تخفیف
  let discountPercent: number | undefined;
  const rawDiscount = pick("discountPercent", offer, part);
  const discountUntil = pick("discountUntil", offer, part);
  if (rawDiscount != null && Number(rawDiscount) > 0) {
    const stillValid = !discountUntil || new Date(discountUntil) > now;
    if (stillValid) {
      discountPercent = Number(rawDiscount);
      base = base * (1 - discountPercent / 100);
    }
  }

  const amountIrr = round(base, rounding);

  // ۷) اعتبار زمانی قیمت
  let validUntil = pick("priceValidUntil", offer, part) ?? undefined;
  if (!validUntil && settings["pricing.showPriceValidity"]) {
    const hours = Number(settings["pricing.validityHours"] ?? 0);
    if (hours > 0) validUntil = new Date(now.getTime() + hours * 3_600_000);
  }

  // ۸) ناموجود: قیمت را پنهان کنیم یا با برچسب ناموجود نشان بدهیم؟
  // پیش‌فرض نمایش است — در کاتالوگی که بیشتر قطعات سفارشی‌اند، پنهان کردن
  // قیمت همه چیز را به استعلام تبدیل می‌کند.
  if (
    settings["pricing.hideWhenOutOfStock"] &&
    stockQty !== undefined &&
    stockQty <= 0
  ) {
    const allowInquiry = pick("allowInquiry", offer, part) ?? settings["inquiry.enabled"];
    if (allowInquiry) return { kind: "inquiry", reason: "out-of-stock" };
  }

  return {
    kind: "price",
    amountIrr,
    ...(discountPercent ? { originalIrr: originalBeforeDiscount, discountPercent } : {}),
    ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
    basis,
    ...(currencyInfo ? { currency: currencyInfo } : {}),
    minOrderQty,
  };
}

/** برچسب‌های fitinpart روی فهرست پیشنهادها: پیشنهادی / ارزان‌ترین / سریع‌ترین */
export type OfferBadge = "recommended" | "cheapest" | "fastest";

export function assignBadges<T extends { id: string; leadTimeDays: number }>(
  offers: Array<T & { price: PriceResult; isDefault?: boolean }>,
): Map<string, OfferBadge[]> {
  const badges = new Map<string, OfferBadge[]>();
  const add = (id: string, badge: OfferBadge) => {
    const list = badges.get(id) ?? [];
    if (!list.includes(badge)) list.push(badge);
    badges.set(id, list);
  };

  const priced = offers.filter((o) => o.price.kind === "price");
  if (priced.length === 0) return badges;

  const cheapest = priced.reduce((a, b) =>
    (a.price as { amountIrr: number }).amountIrr <= (b.price as { amountIrr: number }).amountIrr
      ? a
      : b,
  );
  add(cheapest.id, "cheapest");

  const fastest = priced.reduce((a, b) => (a.leadTimeDays <= b.leadTimeDays ? a : b));
  add(fastest.id, "fastest");

  const recommended = priced.find((o) => o.isDefault) ?? fastest;
  add(recommended.id, "recommended");

  return badges;
}

/** ریال ← تومان و قالب‌بندی فارسی */
export function formatMoney(
  amountIrr: number,
  unit: "toman" | "rial" = "toman",
): string {
  const value = unit === "toman" ? amountIrr / 10 : amountIrr;
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(value);
}

export function moneyLabel(unit: "toman" | "rial" = "toman"): string {
  return unit === "toman" ? "تومان" : "ریال";
}
