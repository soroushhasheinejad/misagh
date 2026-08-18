"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";

/** ذخیره تنظیمات فروشگاه — هر سوییچ و عدد از همین‌جا کنترل می‌شود. */
export async function saveSettings(formData: FormData) {
  const entries: Array<{ key: string; value: unknown }> = [];

  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    const fallback = DEFAULT_SETTINGS[key];
    const raw = formData.get(key);

    let value: unknown;
    if (typeof fallback === "boolean") {
      value = raw === "on" || raw === "true";
    } else if (typeof fallback === "number") {
      const n = Number(raw);
      value = Number.isFinite(n) ? n : fallback;
    } else {
      value = raw === null ? fallback : String(raw);
    }
    entries.push({ key, value });
  }

  for (const { key, value } of entries) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never, group: key.split(".")[0] },
      update: { value: value as never },
    });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

/**
 * به‌روزرسانی نرخ ارز. اگر بازمحاسبه خودکار روشن باشد،
 * قیمت هر قطعه و پیشنهادی که «وابسته به ارز» و قفل‌نشده است تازه می‌شود.
 */
export async function updateRate(formData: FormData) {
  const code = String(formData.get("code"));
  const newRate = Number(formData.get("rateIrr"));
  if (!code || !Number.isFinite(newRate) || newRate <= 0) return;

  const current = await prisma.currency.findUnique({ where: { code } });
  if (!current) return;

  await prisma.$transaction([
    prisma.currency.update({ where: { code }, data: { rateIrr: newRate } }),
    prisma.exchangeRateHistory.create({
      data: {
        currencyCode: code,
        oldRateIrr: current.rateIrr,
        newRateIrr: newRate,
        note: "ویرایش دستی از پنل",
      },
    }),
  ]);

  revalidatePath("/admin/rates");
  revalidatePath("/");
}

/** ویرایش تنظیمات قیمت یک پیشنهاد */
export async function saveOfferPricing(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;

  const numberOrNull = (name: string) => {
    const raw = formData.get(name);
    if (raw === null || String(raw).trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const stringOrNull = (name: string) => {
    const raw = formData.get(name);
    const value = raw === null ? "" : String(raw).trim();
    return value === "" || value === "INHERIT" ? null : value;
  };

  /** سه‌حالته: خالی یعنی از سطح بالاتر ارث ببرد */
  const boolOrNull = (name: string) => {
    const raw = formData.get(name);
    if (raw === null || raw === "INHERIT" || String(raw).trim() === "") return null;
    return String(raw) === "true";
  };

  const previous = await prisma.offer.findUnique({ where: { id } });

  await prisma.offer.update({
    where: { id },
    data: {
      priceMode: stringOrNull("priceMode") as never,
      basePriceIrr: numberOrNull("basePriceIrr"),
      baseCurrencyCode: stringOrNull("baseCurrencyCode"),
      basePriceForeign: numberOrNull("basePriceForeign"),
      costPriceIrr: numberOrNull("costPriceIrr"),
      marginPercent: numberOrNull("marginPercent"),
      discountPercent: numberOrNull("discountPercent"),
      roundingRule: stringOrNull("roundingRule") as never,
      priceLocked: boolOrNull("priceLocked"),
      lockedPriceIrr: numberOrNull("lockedPriceIrr"),
      dealerPriceIrr: numberOrNull("dealerPriceIrr"),
      showPrice: boolOrNull("showPrice"),
      allowInquiry: boolOrNull("allowInquiry"),
      stockQty: Number(formData.get("stockQty") ?? 0),
      leadTimeDays: Number(formData.get("leadTimeDays") ?? 0),
      status: String(formData.get("status") ?? "ACTIVE") as never,
      isDefault: formData.get("isDefault") === "true",
    },
  });

  await prisma.priceHistory.create({
    data: {
      offerId: id,
      partId: previous?.partId,
      oldPriceIrr: previous?.basePriceIrr ?? null,
      newPriceIrr: numberOrNull("basePriceIrr"),
      reason: "ویرایش دستی پیشنهاد",
    },
  });

  revalidatePath(`/admin/parts`);
}

/** ویرایش تنظیمات قیمت در سطح قطعه (پیش‌فرض همه پیشنهادهای آن) */
export async function savePartPricing(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;

  const numberOrNull = (name: string) => {
    const raw = formData.get(name);
    if (raw === null || String(raw).trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const stringOrNull = (name: string) => {
    const raw = formData.get(name);
    const value = raw === null ? "" : String(raw).trim();
    return value === "" || value === "INHERIT" ? null : value;
  };

  /** سه‌حالته: خالی یعنی از سطح بالاتر ارث ببرد */
  const boolOrNull = (name: string) => {
    const raw = formData.get(name);
    if (raw === null || raw === "INHERIT" || String(raw).trim() === "") return null;
    return String(raw) === "true";
  };

  await prisma.part.update({
    where: { id },
    data: {
      priceMode: stringOrNull("priceMode") as never,
      basePriceIrr: numberOrNull("basePriceIrr"),
      baseCurrencyCode: stringOrNull("baseCurrencyCode"),
      basePriceForeign: numberOrNull("basePriceForeign"),
      marginPercent: numberOrNull("marginPercent"),
      discountPercent: numberOrNull("discountPercent"),
      roundingRule: stringOrNull("roundingRule") as never,
      priceLocked: boolOrNull("priceLocked"),
      lockedPriceIrr: numberOrNull("lockedPriceIrr"),
      dealerMargin: numberOrNull("dealerMargin"),
      showPrice: boolOrNull("showPrice"),
      allowInquiry: boolOrNull("allowInquiry"),
      allowMultiOffer: boolOrNull("allowMultiOffer"),
      minOrderQty: Number(formData.get("minOrderQty") ?? 1),
    },
  });

  revalidatePath(`/admin/parts/${id}`);
}
