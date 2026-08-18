import { getSettings, DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";
import { saveSettings } from "@/app/admin/actions";

const LABELS: Record<SettingKey, string> = {
  "pricing.enabled": "نمایش قیمت در کل سایت",
  "pricing.defaultMode": "حالت پیش‌فرض قیمت‌گذاری",
  "pricing.defaultCurrency": "ارز پایه پیش‌فرض",
  "pricing.defaultMarginPercent": "حاشیه سود پیش‌فرض (٪)",
  "pricing.defaultRounding": "قاعده رند کردن قیمت",
  "pricing.validityHours": "اعتبار قیمت (ساعت)",
  "pricing.cartLockMinutes": "قفل قیمت سبد (دقیقه)",
  "pricing.showPriceValidity": "نمایش «قیمت تا … معتبر است»",
  "pricing.vatPercent": "مالیات بر ارزش افزوده (٪)",
  "pricing.autoRecalcOnRateChange": "بازمحاسبه خودکار با تغییر نرخ ارز",
  "offers.multiOfferEnabled": "نمایش چند پیشنهاد برای هر قطعه",
  "offers.showSupplierName": "نمایش نام تامین‌کننده به مشتری",
  "offers.showLeadTime": "نمایش زمان تحویل",
  "offers.showStockQty": "نمایش تعداد موجودی",
  "offers.showBadges": "برچسب پیشنهاد ما / ارزان‌ترین / سریع‌ترین",
  "offers.maxVisible": "تعداد پیشنهاد قابل نمایش",
  "offers.sortBy": "ترتیب پیشنهادها",
  "dealer.enabled": "قیمت همکار فعال باشد",
  "dealer.defaultMarginPercent": "حاشیه سود همکار (٪)",
  "dealer.minOrderIrr": "حداقل سفارش همکار (ریال)",
  "inquiry.enabled": "استعلام قیمت فعال باشد",
  "inquiry.telegramUsername": "نام کاربری تلگرام",
  "inquiry.whatsappNumber": "شماره واتساپ (با کد کشور)",
  "inquiry.showOnEveryProduct": "دکمه استعلام روی همه محصولات",
  "inquiry.buttonLabelFa": "متن دکمه استعلام",
  "search.vinEnabled": "جستجو با شماره شاسی",
  "search.oemEnabled": "جستجو با شماره فنی",
  "search.crossReferenceEnabled": "نمایش کدهای معادل",
  "search.logZeroResults": "ثبت جستجوهای بی‌نتیجه",
  "store.name": "نام فروشگاه",
  "store.phone": "تلفن فروشگاه",
  "store.displayUnit": "واحد نمایش قیمت",
  "store.compareEnabled": "مقایسه قطعات",
};

const GROUP_TITLES: Record<string, string> = {
  pricing: "قیمت‌گذاری",
  offers: "پیشنهادهای چندگانه",
  dealer: "قیمت همکار",
  inquiry: "استعلام و پیام‌رسان",
  search: "جستجو",
  store: "عمومی",
};

const CHOICES: Partial<Record<SettingKey, Array<[string, string]>>> = {
  "pricing.defaultMode": [
    ["FIXED", "قیمت ثابت ریالی"],
    ["CURRENCY_LINKED", "وابسته به نرخ ارز"],
    ["INQUIRY", "فقط استعلام"],
    ["HIDDEN", "بدون قیمت"],
  ],
  "pricing.defaultCurrency": [
    ["USD", "دلار"],
    ["AED", "درهم"],
    ["EUR", "یورو"],
    ["CNY", "یوان"],
  ],
  "pricing.defaultRounding": [
    ["NONE", "بدون رند"],
    ["NEAREST_1K", "نزدیک‌ترین ۱٬۰۰۰ ریال"],
    ["NEAREST_10K", "نزدیک‌ترین ۱۰٬۰۰۰ ریال"],
    ["NEAREST_100K", "نزدیک‌ترین ۱۰۰٬۰۰۰ ریال"],
    ["UP_10K", "رو به بالا ۱۰٬۰۰۰ ریال"],
    ["UP_100K", "رو به بالا ۱۰۰٬۰۰۰ ریال"],
  ],
  "offers.sortBy": [
    ["recommended", "پیشنهاد ما"],
    ["price", "ارزان‌ترین"],
    ["lead", "سریع‌ترین"],
  ],
  "store.displayUnit": [
    ["toman", "تومان"],
    ["rial", "ریال"],
  ],
};

export default async function SettingsPage() {
  const settings = await getSettings();
  const keys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
  const groups = [...new Set(keys.map((k) => k.split(".")[0]))];

  return (
    <div>
      <h1 className="text-lg font-bold">تنظیمات فروشگاه</h1>
      <p className="pt-1 text-sm text-muted">
        هر گزینه اینجا روی کل سایت اثر می‌گذارد؛ در سطح هر قطعه و هر پیشنهاد هم می‌شود جداگانه override کرد.
      </p>

      <form action={saveSettings} className="pt-6">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group} className="rounded-lg border border-line bg-surface p-4">
              <h2 className="pb-3 text-sm font-bold">{GROUP_TITLES[group] ?? group}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {keys
                  .filter((k) => k.startsWith(`${group}.`))
                  .map((key) => {
                    const value = settings[key];
                    const choices = CHOICES[key];

                    if (typeof value === "boolean") {
                      return (
                        <label key={key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name={key}
                            defaultChecked={value}
                            className="size-4 accent-[var(--color-accent)]"
                          />
                          <span>{LABELS[key]}</span>
                        </label>
                      );
                    }

                    return (
                      <label key={key} className="block text-sm">
                        <span className="mb-1 block text-xs text-muted">{LABELS[key]}</span>
                        {choices ? (
                          <select
                            name={key}
                            defaultValue={String(value)}
                            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
                          >
                            {choices.map(([v, label]) => (
                              <option key={v} value={v}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name={key}
                            type={typeof value === "number" ? "number" : "text"}
                            step="any"
                            defaultValue={String(value)}
                            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm"
                          />
                        )}
                      </label>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>

        <button
          type="submit"
          className="mt-5 rounded bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          ذخیره تنظیمات
        </button>
      </form>
    </div>
  );
}
