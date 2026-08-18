import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { priceOffers } from "@/lib/catalog";
import { savePartPricing, saveOfferPricing } from "@/app/admin/actions";
import { formatMoney, moneyLabel } from "@/lib/pricing";

const MODE_OPTIONS: Array<[string, string]> = [
  ["INHERIT", "ارث از سطح بالاتر"],
  ["FIXED", "قیمت ثابت ریالی"],
  ["CURRENCY_LINKED", "وابسته به نرخ ارز"],
  ["INQUIRY", "فقط استعلام قیمت"],
  ["HIDDEN", "نمایش بدون قیمت"],
];

const ROUNDING_OPTIONS: Array<[string, string]> = [
  ["INHERIT", "ارث از تنظیمات"],
  ["NONE", "بدون رند"],
  ["NEAREST_1K", "نزدیک‌ترین ۱٬۰۰۰"],
  ["NEAREST_10K", "نزدیک‌ترین ۱۰٬۰۰۰"],
  ["NEAREST_100K", "نزدیک‌ترین ۱۰۰٬۰۰۰"],
  ["UP_10K", "رو به بالا ۱۰٬۰۰۰"],
  ["UP_100K", "رو به بالا ۱۰۰٬۰۰۰"],
];

const STATUS_OPTIONS: Array<[string, string]> = [
  ["ACTIVE", "فعال"],
  ["OUT_OF_STOCK", "ناموجود"],
  ["DISABLED", "غیرفعال"],
];

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">{label}</span>
      <input
        name={name}
        type={type}
        step="any"
        defaultValue={defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)}
        className="field"
      />
      {hint ? <span className="pt-1 block text-[11px] text-faint">{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? "INHERIT"}
        className="field"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * سوییچ سه‌حالته. «ارث» یعنی این سطح تصمیم نمی‌گیرد و مقدار از سطح بالاتر می‌آید —
 * بدون این حالت، خاموشِ پیش‌فرضِ یک پیشنهاد، تصمیم قطعه را باطل می‌کرد.
 */
function Toggle({
  label,
  name,
  value,
  hint,
}: {
  label: string;
  name: string;
  value?: boolean | null;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">{label}</span>
      <select
        name={name}
        defaultValue={value === null || value === undefined ? "INHERIT" : String(value)}
        className="field"
      >
        <option value="INHERIT">ارث از سطح بالاتر</option>
        <option value="true">روشن</option>
        <option value="false">خاموش</option>
      </select>
      {hint ? <span className="block pt-1 text-[11px] text-faint">{hint}</span> : null}
    </label>
  );
}

export default async function AdminPartPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [part, currencies, settings] = await Promise.all([
    prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        numbers: true,
        offers: {
          include: { brand: true, supplier: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.currency.findMany(),
    getSettings(),
  ]);
  if (!part) notFound();

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const priced = await priceOffers(part, part.offers, { settings });
  const currencyOptions: Array<[string, string]> = [
    ["INHERIT", "ارث از تنظیمات"],
    ...currencies.map((c) => [c.code, c.nameFa] as [string, string]),
  ];

  return (
    <div>
      <Link href="/admin/parts" className="text-xs text-muted hover:text-brass-dark">
        ← بازگشت به فهرست قطعات
      </Link>
      <h1 className="pt-2 font-display text-xl font-black">{part.nameFa}</h1>
      <div className="pt-1 text-sm text-muted">
        {part.category.nameFa}
        {part.numbers[0] ? (
          <>
            {" — "}
            <span className="plate text-xs">{part.numbers[0].number}</span>
          </>
        ) : null}
      </div>

      {/* ---------------- قیمت‌گذاری در سطح قطعه ---------------- */}
      <form action={savePartPricing} className="panel panel-brass mt-6 p-5">
        <input type="hidden" name="id" value={part.id} />
        <h2 className="font-display text-base font-bold">قیمت‌گذاری قطعه</h2>
        <p className="pb-4 text-xs text-muted">
          این تنظیمات پیش‌فرض همه پیشنهادهای این قطعه است. هر پیشنهاد می‌تواند مقدار خودش را داشته باشد.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="حالت قیمت" name="priceMode" options={MODE_OPTIONS} defaultValue={part.priceMode} />
          <SelectField label="ارز پایه" name="baseCurrencyCode" options={currencyOptions} defaultValue={part.baseCurrencyCode} />
          <SelectField label="رند کردن" name="roundingRule" options={ROUNDING_OPTIONS} defaultValue={part.roundingRule} />

          <Field label="قیمت پایه ریالی" name="basePriceIrr" type="number" defaultValue={part.basePriceIrr ? Number(part.basePriceIrr) : null} />
          <Field label="قیمت پایه ارزی" name="basePriceForeign" type="number" defaultValue={part.basePriceForeign ? Number(part.basePriceForeign) : null} hint="در حالت وابسته به ارز استفاده می‌شود" />
          <Field label="حاشیه سود (٪)" name="marginPercent" type="number" defaultValue={part.marginPercent ? Number(part.marginPercent) : null} />

          <Field label="تخفیف (٪)" name="discountPercent" type="number" defaultValue={part.discountPercent ? Number(part.discountPercent) : null} />
          <Field label="قیمت قفل‌شده (ریال)" name="lockedPriceIrr" type="number" defaultValue={part.lockedPriceIrr ? Number(part.lockedPriceIrr) : null} hint="اگر قفل فعال باشد همین عدد نمایش داده می‌شود" />
          <Field label="حاشیه سود همکار (٪)" name="dealerMargin" type="number" defaultValue={part.dealerMargin ? Number(part.dealerMargin) : null} />

          <Field label="حداقل تعداد سفارش" name="minOrderQty" type="number" defaultValue={part.minOrderQty} />
        </div>

        <div className="grid gap-4 pt-4 sm:grid-cols-4">
          <Toggle
            label="قفل قیمت"
            name="priceLocked"
            value={part.priceLocked}
            hint="قیمت قفل‌شده، قیمت نهایی است و نرخ ارز تکانش نمی‌دهد"
          />
          <Toggle label="نمایش قیمت" name="showPrice" value={part.showPrice} />
          <Toggle label="اجازه استعلام" name="allowInquiry" value={part.allowInquiry} />
          <Toggle label="نمایش چند پیشنهاد" name="allowMultiOffer" value={part.allowMultiOffer} />
        </div>

        <button type="submit" className="btn btn-brass mt-4">
          ذخیره قیمت قطعه
        </button>
      </form>

      {/* ---------------- پیشنهادها ---------------- */}
      <h2 className="pt-8 pb-2 text-sm font-bold">پیشنهادهای این قطعه ({part.offers.length})</h2>

      <div className="flex flex-col gap-4">
        {part.offers.map((offer) => {
          const computed = priced.find((p) => p.id === offer.id);
          return (
            <form key={offer.id} action={saveOfferPricing} className="panel p-5">
              <input type="hidden" name="id" value={offer.id} />

              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
                <div className="text-sm font-bold">
                  {offer.brand?.nameFa ?? "بدون برند"}
                  <span className="pr-2 text-xs font-normal text-faint">
                    {offer.supplier?.name ?? "بدون تامین‌کننده"}
                  </span>
                </div>
                <div className="text-sm">
                  {computed?.price.kind === "price" ? (
                    <span className="tnum font-bold text-ok">
                      قیمت نهایی: {formatMoney(computed.price.amountIrr, unit)} {moneyLabel(unit)}
                    </span>
                  ) : computed?.price.kind === "inquiry" ? (
                    <span className="text-alert">استعلام قیمت</span>
                  ) : (
                    <span className="text-faint">بدون نمایش قیمت</span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField label="حالت قیمت" name="priceMode" options={MODE_OPTIONS} defaultValue={offer.priceMode} />
                <SelectField label="ارز پایه" name="baseCurrencyCode" options={currencyOptions} defaultValue={offer.baseCurrencyCode} />
                <SelectField label="رند کردن" name="roundingRule" options={ROUNDING_OPTIONS} defaultValue={offer.roundingRule} />

                <Field label="قیمت پایه ریالی" name="basePriceIrr" type="number" defaultValue={offer.basePriceIrr ? Number(offer.basePriceIrr) : null} />
                <Field label="قیمت پایه ارزی" name="basePriceForeign" type="number" defaultValue={offer.basePriceForeign ? Number(offer.basePriceForeign) : null} />
                <Field label="قیمت خرید (ریال)" name="costPriceIrr" type="number" defaultValue={offer.costPriceIrr ? Number(offer.costPriceIrr) : null} hint="فقط در پنل دیده می‌شود" />

                <Field label="حاشیه سود (٪)" name="marginPercent" type="number" defaultValue={offer.marginPercent ? Number(offer.marginPercent) : null} />
                <Field label="تخفیف (٪)" name="discountPercent" type="number" defaultValue={offer.discountPercent ? Number(offer.discountPercent) : null} />
                <Field label="قیمت قفل‌شده (ریال)" name="lockedPriceIrr" type="number" defaultValue={offer.lockedPriceIrr ? Number(offer.lockedPriceIrr) : null} />

                <Field label="قیمت همکار (ریال)" name="dealerPriceIrr" type="number" defaultValue={offer.dealerPriceIrr ? Number(offer.dealerPriceIrr) : null} />
                <Field label="موجودی" name="stockQty" type="number" defaultValue={offer.stockQty} />
                <Field label="زمان تحویل (روز)" name="leadTimeDays" type="number" defaultValue={offer.leadTimeDays} />

                <SelectField label="وضعیت" name="status" options={STATUS_OPTIONS} defaultValue={offer.status} />
              </div>

              <div className="grid gap-4 pt-4 sm:grid-cols-4">
                <Toggle label="قفل قیمت" name="priceLocked" value={offer.priceLocked} />
                <Toggle label="نمایش قیمت" name="showPrice" value={offer.showPrice} />
                <Toggle label="اجازه استعلام" name="allowInquiry" value={offer.allowInquiry} />
                <label className="block text-sm">
                  <span className="field-label">پیشنهاد پیش‌فرض</span>
                  <select name="isDefault" defaultValue={String(offer.isDefault)} className="field">
                    <option value="true">بله</option>
                    <option value="false">خیر</option>
                  </select>
                </label>
              </div>

              <button type="submit" className="btn btn-brass mt-4">
                ذخیره این پیشنهاد
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
