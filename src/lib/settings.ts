import { prisma } from "@/lib/prisma";

/**
 * تنظیمات فروشگاه.
 * هر کلید از پنل مدیریت قابل تغییر یا خاموش کردن است؛ مقادیر زیر فقط پیش‌فرض‌اند.
 * همه مبالغ به ریال ذخیره می‌شوند و در نمایش به تومان تبدیل می‌شوند.
 */
export const DEFAULT_SETTINGS = {
  // ---- قیمت‌گذاری ----
  "pricing.enabled": true, // نمایش قیمت در کل سایت
  "pricing.defaultMode": "CURRENCY_LINKED", // FIXED | CURRENCY_LINKED | INQUIRY | HIDDEN
  "pricing.defaultCurrency": "USD",
  "pricing.defaultMarginPercent": 25,
  "pricing.defaultRounding": "NEAREST_10K", // روی ریال اعمال می‌شود
  "pricing.validityHours": 24, // اعتبار قیمت اعلام‌شده
  "pricing.cartLockMinutes": 30, // قفل قیمت سبد هنگام تسویه
  "pricing.showPriceValidity": true,
  "pricing.vatPercent": 0,
  "pricing.autoRecalcOnRateChange": true, // با تغییر نرخ ارز، قیمت‌ها بازمحاسبه شوند
  "pricing.hideWhenOutOfStock": false, // قیمت قطعه ناموجود پنهان شود و جایش استعلام بیاید

  // ---- چند پیشنهاد برای یک قطعه (مثل fitinpart) ----
  "offers.multiOfferEnabled": true, // خاموش شود: فقط پیشنهاد پیش‌فرض دیده می‌شود
  "offers.showSupplierName": false, // نام تامین‌کننده برای مشتری دیده شود؟
  "offers.showLeadTime": true, // ستون زمان تحویل
  "offers.showStockQty": true, // نمایش تعداد موجودی
  "offers.showBadges": true, // برچسب پیشنهادی / سریع‌ترین / ارزان‌ترین
  "offers.maxVisible": 4, // بقیه پشت دکمه «پیشنهادهای بیشتر»
  "offers.sortBy": "recommended", // recommended | price | lead

  // ---- قیمت همکار ----
  "dealer.enabled": true,
  "dealer.defaultMarginPercent": 12,
  "dealer.minOrderIrr": 0,

  // ---- استعلام و پیام‌رسان ----
  "inquiry.enabled": true,
  "inquiry.telegramUsername": "",
  "inquiry.whatsappNumber": "",
  "inquiry.showOnEveryProduct": true,
  "inquiry.buttonLabelFa": "استعلام قیمت",

  // ---- جستجو ----
  "search.vinEnabled": true,
  "search.oemEnabled": true,
  "search.crossReferenceEnabled": true,
  "search.logZeroResults": true,

  // ---- عمومی ----
  "store.name": "میثاق یدک",
  "store.phone": "",
  "store.displayUnit": "toman", // toman | rial
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = { [K in SettingKey]: (typeof DEFAULT_SETTINGS)[K] };

/** همه تنظیمات را می‌خواند و روی پیش‌فرض‌ها سوار می‌کند. */
export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) merged[row.key] = row.value;
  }
  return merged as Settings;
}

export async function getSetting<K extends SettingKey>(key: K): Promise<Settings[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return (row?.value ?? DEFAULT_SETTINGS[key]) as Settings[K];
}

export async function setSetting<K extends SettingKey>(key: K, value: Settings[K]) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: value as never, group: key.split(".")[0] },
    update: { value: value as never },
  });
}
