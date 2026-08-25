import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computePrice, type PriceResult } from "@/lib/pricing";
import { getExchangeRates } from "@/lib/catalog";

/**
 * سبد خرید مهمان.
 *
 * سبد با یک شناسه در کوکی نگه داشته می‌شود، پس مشتری برای خرید لازم نیست
 * حساب بسازد. وقتی ورود پیامکی اضافه شد، همین سبد به کاربر وصل می‌شود.
 *
 * قیمت هر ردیف در لحظه افزودن قفل می‌شود تا تغییر نرخ ارز وسط خرید،
 * مبلغ سبد مشتری را جابه‌جا نکند.
 */

const CART_COOKIE = "misagh_cart";

export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** فقط در اکشن‌های سرور قابل استفاده است، چون کوکی می‌نویسد */
export async function ensureCartToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return token;
}

export type CartLine = {
  itemId: string;
  offerId: string;
  partId: string;
  slug: string;
  nameFa: string;
  partNumber: string | null;
  brandName: string | null;
  qty: number;
  stockQty: number;
  leadTimeDays: number;
  unitPriceIrr: number;
  lineTotalIrr: number;
  /** قیمت روز، اگر با قیمت قفل‌شده فرق داشته باشد */
  currentPrice: PriceResult;
};

export type CartView = {
  lines: CartLine[];
  count: number;
  subtotalIrr: number;
};

const EMPTY: CartView = { lines: [], count: 0, subtotalIrr: 0 };

export async function getCart(): Promise<CartView> {
  const token = await getCartToken();
  if (!token) return EMPTY;

  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          offer: {
            include: {
              brand: true,
              part: { include: { numbers: { where: { isPrimary: true }, take: 1 } } },
            },
          },
        },
      },
    },
  });
  if (!cart || cart.items.length === 0) return EMPTY;

  const [settings, rates] = await Promise.all([getSettings(), getExchangeRates()]);

  const lines: CartLine[] = cart.items.map((item) => {
    const offer = item.offer;
    const part = offer.part;

    const currentPrice = computePrice({
      offer: {
        priceMode: offer.priceMode,
        basePriceIrr: offer.basePriceIrr ? Number(offer.basePriceIrr) : null,
        baseCurrencyCode: offer.baseCurrencyCode,
        basePriceForeign: offer.basePriceForeign ? Number(offer.basePriceForeign) : null,
        marginPercent: offer.marginPercent ? Number(offer.marginPercent) : null,
        discountPercent: offer.discountPercent ? Number(offer.discountPercent) : null,
        roundingRule: offer.roundingRule,
        priceLocked: offer.priceLocked,
        lockedPriceIrr: offer.lockedPriceIrr ? Number(offer.lockedPriceIrr) : null,
        showPrice: offer.showPrice,
        allowInquiry: offer.allowInquiry,
      },
      part: {
        priceMode: part.priceMode,
        basePriceIrr: part.basePriceIrr ? Number(part.basePriceIrr) : null,
        baseCurrencyCode: part.baseCurrencyCode,
        basePriceForeign: part.basePriceForeign ? Number(part.basePriceForeign) : null,
        marginPercent: part.marginPercent ? Number(part.marginPercent) : null,
        roundingRule: part.roundingRule,
        priceLocked: part.priceLocked,
        lockedPriceIrr: part.lockedPriceIrr ? Number(part.lockedPriceIrr) : null,
        showPrice: part.showPrice,
        allowInquiry: part.allowInquiry,
      },
      settings,
      rates,
      stockQty: offer.stockQty,
    });

    const locked = item.lockedPrice ? Number(item.lockedPrice) : null;
    const unitPriceIrr =
      locked ?? (currentPrice.kind === "price" ? currentPrice.amountIrr : 0);

    return {
      itemId: item.id,
      offerId: offer.id,
      partId: part.id,
      slug: part.slug,
      nameFa: part.nameFa,
      partNumber: part.numbers[0]?.number ?? null,
      brandName: offer.brand?.nameFa ?? null,
      qty: item.qty,
      stockQty: offer.stockQty,
      leadTimeDays: offer.leadTimeDays,
      unitPriceIrr,
      lineTotalIrr: unitPriceIrr * item.qty,
      currentPrice,
    };
  });

  return {
    lines,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotalIrr: lines.reduce((sum, l) => sum + l.lineTotalIrr, 0),
  };
}

/** فقط تعداد اقلام — برای نشان سبد در سربرگ */
export async function getCartCount(): Promise<number> {
  const token = await getCartToken();
  if (!token) return 0;

  const result = await prisma.cartItem.aggregate({
    where: { cart: { token } },
    _sum: { qty: true },
  });
  return result._sum.qty ?? 0;
}
