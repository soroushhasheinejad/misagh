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
  "pricing.hideWhenOutOfStock": "پنهان کردن قیمت قطعات ناموجود",
  "inventory.assumeInStock": "قطعات بدون شمارش انبار، موجود در نظر گرفته شوند",
  "inventory.defaultLeadDays": "زمان تحویل قطعات بدون شمارش (روز)",
  "inventory.showExactCount": "نمایش تعداد دقیق وقتی شمارش داریم",
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
};

const GROUP_TITLES: Record<string, string> = {
  pricing: "قیمت‌گذاری",
  inventory: "موجودی",
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
      <div className="rule pb-3"><h1 className="font-display text-xl font-black">تنظیمات فروشگاه</h1></div>
      <p className="pt-1 text-sm text-muted">
        هر گزینه اینجا روی کل سایت اثر می‌گذارد؛ در سطح هر قطعه و هر پیشنهاد هم می‌شود جداگانه override کرد.
      </p>

      <form action={saveSettings} className="pt-6">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group} className="panel p-5">
              <div className="rule pb-4"><h2 className="font-display text-base font-bold">{GROUP_TITLES[group] ?? group}</h2></div>
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
                            className="size-4 accent-[var(--color-brass)]"
                          />
                          <span>{LABELS[key]}</span>
                        </label>
                      );
                    }

                    return (
                      <label key={key} className="block text-sm">
                        <span className="field-label">{LABELS[key]}</span>
                        {choices ? (
                          <select
                            name={key}
                            defaultValue={String(value)}
                            className="field"
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
                            className="field"
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
          className="btn btn-brass mt-5"
        >
          ذخیره تنظیمات
        </button>
      </form>
    </div>
  );
}
