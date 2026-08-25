import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPartBySlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { faYearRange, faNumber } from "@/lib/format";
import { addToCart } from "@/app/cart/actions";
import { TelegramInquiry } from "@/components/TelegramInquiry";

const POSITION: Record<string, string> = {
  UNIVERSAL: "—",
  FRONT: "جلو",
  REAR: "عقب",
  LEFT: "چپ",
  RIGHT: "راست",
  FRONT_LEFT: "جلو چپ",
  FRONT_RIGHT: "جلو راست",
  REAR_LEFT: "عقب چپ",
  REAR_RIGHT: "عقب راست",
  UPPER: "بالا",
  LOWER: "پایین",
};

const NUMBER_TYPE: Record<string, string> = {
  OEM: "اصلی سازنده",
  SUPERSEDED: "کد قدیمی",
  AFTERMARKET: "بازار",
  INTERNAL: "داخلی",
};

const TIER: Record<string, string> = {
  GENUINE: "جنیون",
  OEM_SUPPLIER: "سازنده اصلی",
  HIGH_COPY: "های‌کپی",
  AFTERMARKET: "متفرقه",
  USED: "استوک",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPartBySlug(slug);
  if (!data) return { title: "قطعه پیدا نشد" };

  const number = data.part.numbers.find((n) => n.isPrimary) ?? data.part.numbers[0];
  return {
    title: `${data.part.nameFa}${number ? ` — ${number.number}` : ""}`,
    description:
      data.part.description ??
      `${data.part.nameFa} با شماره فنی ${number?.number ?? ""}؛ سازگاری، موجودی و قیمت.`,
  };
}

export default async function PartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPartBySlug(slug);
  if (!data) notFound();

  const { part, offers } = data;
  const settings = await getSettings();
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  const primary = part.numbers.find((n) => n.isPrimary) ?? part.numbers[0];
  const specs = (part.specs ?? null) as Record<string, string | number> | null;

  // یک قطعه، یک قیمت: پیشنهاد پیش‌فرض یا بهترین پیشنهاد دارای قیمت
  const selling =
    offers.find((o) => o.isDefault && o.price.kind === "price") ??
    offers.find((o) => o.price.kind === "price") ??
    offers.find((o) => o.isDefault) ??
    offers[0];

  const price = selling?.price;
  const available = selling?.available ?? false;
  const buyable = price?.kind === "price" && available;

  // فقط مشخصاتی که مقدار دارند
  const specRows = specs
    ? Object.entries(specs).filter(([, v]) => v !== null && v !== "" && v !== undefined)
    : [];

  const telegram = String(settings["inquiry.telegramUsername"] ?? "").trim();

  // خودروی اول برای متن پیام تلگرام
  const fit = part.fitments[0];
  const firstVehicle = fit
    ? [fit.make?.nameFa, fit.model?.nameFa, fit.generation?.nameFa].filter(Boolean).join(" ")
    : null;

  const inquiryHref = `/inquiry?part=${encodeURIComponent(part.nameFa)}${
    primary ? `&pn=${encodeURIComponent(primary.number)}` : ""
  }`;

  return (
    <div>
      {/* ---------------- سربرگ قطعه ---------------- */}
      <div className="border-b border-brass/25 bg-carbon text-white">
        <div className="mx-auto max-w-[1120px] px-5 py-9">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <Link href="/" className="hover:text-brass">
              خانه
            </Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-brass">
              محصولات
            </Link>
            <span>/</span>
            <Link
              href={`/catalog?categoryId=${part.category.id}`}
              className="hover:text-brass"
            >
              {part.category.nameFa}
            </Link>
          </nav>

          <h1 className="max-w-3xl pt-5 font-display text-2xl font-black leading-[1.6]">
            {part.nameFa}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-5">
            {primary ? <span className="plate plate-dark plate-lg">{primary.number}</span> : null}
            {selling?.brandName ? (
              <span className="text-sm text-white/60">{selling.brandName}</span>
            ) : null}
            {selling?.qualityTier ? (
              <span className="rounded border border-brass/40 px-2 py-0.5 text-xs text-brass-lite">
                {TIER[selling.qualityTier] ?? selling.qualityTier}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* ---------------- ستون اطلاعات ---------------- */}
          <div className="order-2 flex flex-col gap-10 lg:order-1">
            {part.description ? (
              <section>
                <div className="flex items-center gap-2.5 pb-4">
                  <span className="size-[7px] rotate-45 bg-brass" />
                  <h2 className="font-display text-base font-bold">درباره این قطعه</h2>
                </div>
                <p className="max-w-[68ch] leading-9 text-muted">{part.description}</p>
              </section>
            ) : null}

            {/* خودروهای سازگار */}
            <section>
              <div className="flex items-center gap-2.5 pb-4">
                <span className="size-[7px] rotate-45 bg-brass" />
                <h2 className="font-display text-base font-bold">
                  روی چه خودروهایی می‌نشیند
                </h2>
              </div>

              {part.fitments.length === 0 ? (
                <div className="panel p-5 text-sm text-muted">
                  سازگاری این قطعه هنوز ثبت نشده است. پیش از خرید با ما تماس بگیرید تا بررسی
                  کنیم.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-line bg-surface">
                  <table className="spec min-w-[460px]">
                    <thead>
                      <tr>
                        <th>خودرو</th>
                        <th>سال</th>
                        <th>محل نصب</th>
                      </tr>
                    </thead>
                    <tbody>
                      {part.fitments.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <div className="font-medium">
                              {[f.make?.nameFa, f.model?.nameFa, f.generation?.nameFa, f.trim?.nameFa]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                            {f.note ? (
                              <div className="pt-1 text-xs text-faint">{f.note}</div>
                            ) : null}
                          </td>
                          <td className="tnum text-muted">
                            {f.generation
                              ? faYearRange(
                                  f.yearFrom ?? f.generation.yearStart,
                                  f.yearTo ?? f.generation.yearEnd,
                                )
                              : "—"}
                          </td>
                          <td className="text-muted">{POSITION[f.position] ?? f.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* شماره‌های فنی */}
            <section>
              <div className="flex items-center gap-2.5 pb-4">
                <span className="size-[7px] rotate-45 bg-brass" />
                <h2 className="font-display text-base font-bold">شماره‌های فنی و معادل‌ها</h2>
              </div>
              <div className="overflow-x-auto rounded-md border border-line bg-surface">
                <table className="spec min-w-[420px]">
                  <thead>
                    <tr>
                      <th>شماره</th>
                      <th>نوع</th>
                      <th>برند</th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.numbers.map((n) => (
                      <tr key={n.id}>
                        <td>
                          <span className="plate text-xs">{n.number}</span>
                        </td>
                        <td className="text-muted">{NUMBER_TYPE[n.type] ?? n.type}</td>
                        <td className="text-muted">{n.brand?.nameFa ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="pt-3 text-xs leading-6 text-faint">
                کد قدیمی و کد جایگزین به هم وصل‌اند؛ جستجوی هر کدام، همه را می‌آورد.
              </p>
            </section>

            {/* مشخصات */}
            {specRows.length > 0 || part.weightGram ? (
              <section>
                <div className="flex items-center gap-2.5 pb-4">
                  <span className="size-[7px] rotate-45 bg-brass" />
                  <h2 className="font-display text-base font-bold">مشخصات</h2>
                </div>
                <div className="overflow-hidden rounded-md border border-line bg-surface">
                  <table className="spec">
                    <tbody>
                      {specRows.map(([key, value]) => (
                        <tr key={key}>
                          <td className="w-40 text-muted">{key.replace(/_/g, " ")}</td>
                          <td className="font-medium">{String(value)}</td>
                        </tr>
                      ))}
                      {part.weightGram ? (
                        <tr>
                          <td className="w-40 text-muted">وزن</td>
                          <td className="tnum font-medium">
                            {faNumber(part.weightGram)} گرم
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>

          {/* ---------------- پنل خرید ---------------- */}
          <aside className="order-1 lg:order-2">
            <div className="panel panel-brass sticky top-6 p-6">
              {price?.kind === "price" ? (
                <>
                  <div className="text-xs text-muted">قیمت</div>
                  <div className="tnum pt-1 font-display text-[1.7rem] font-black leading-tight">
                    {formatMoney(price.amountIrr, unit)}
                    <span className="pr-1.5 text-sm font-medium text-muted">
                      {moneyLabel(unit)}
                    </span>
                  </div>

                  {price.originalIrr ? (
                    <div className="tnum pt-1 text-sm text-faint line-through">
                      {formatMoney(price.originalIrr, unit)}
                    </div>
                  ) : null}

                  {price.validUntil && settings["pricing.showPriceValidity"] ? (
                    <p className="pt-2 text-xs leading-6 text-faint">
                      این قیمت تا{" "}
                      {new Intl.DateTimeFormat("fa-IR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(price.validUntil)}{" "}
                      معتبر است.
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="font-display text-lg font-black text-alert">استعلام قیمت</div>
                  <p className="pt-2 text-sm leading-7 text-muted">
                    قیمت این قطعه به نرخ روز بستگی دارد. درخواست بدهید تا همان روز اعلام کنیم.
                  </p>
                </>
              )}

              {/* وضعیت موجودی و تحویل */}
              <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">موجودی</span>
                  <span className={available ? "font-medium text-ok" : "font-medium text-alert"}>
                    {selling?.stockLabel ?? "ناموجود"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">زمان تحویل</span>
                  <span className="tnum font-medium">
                    {selling && selling.leadTimeDays > 0
                      ? `${faNumber(selling.leadTimeDays)} روز کاری`
                      : "آماده ارسال"}
                  </span>
                </div>
              </div>

              {/* دکمه خرید */}
              {buyable ? (
                <form action={addToCart} className="mt-6 flex flex-col gap-3">
                  <input type="hidden" name="offerId" value={selling!.id} />
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">تعداد</span>
                    <input
                      name="qty"
                      type="number"
                      min={1}
                      max={selling!.stockQty > 0 ? selling!.stockQty : undefined}
                      defaultValue={1}
                      className="field tnum w-24 py-1.5 text-center"
                    />
                  </label>
                  <button type="submit" className="btn btn-brass w-full py-3 text-base">
                    افزودن به سبد خرید
                  </button>
                </form>
              ) : (
                <Link href={inquiryHref} className="btn btn-brass mt-6 w-full py-3">
                  {price?.kind === "price" ? "درخواست تامین" : "استعلام قیمت"}
                </Link>
              )}

              {telegram ? (
                <div className="mt-3">
                  <TelegramInquiry
                    username={telegram}
                    partName={part.nameFa}
                    partNumber={primary?.number}
                    vehicle={firstVehicle}
                  />
                </div>
              ) : null}

              <Link
                href={inquiryHref}
                className="mt-3 block text-center text-xs text-muted link-brass"
              >
                سوالی درباره این قطعه دارید؟
              </Link>

              <ul className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-xs leading-6 text-muted">
                <li>ضمانت اصالت؛ قطعه با همان برند اعلام‌شده تحویل می‌شود.</li>
                <li>هفت روز مهلت بازگشت برای قطعه باز نشده.</li>
                <li>ارسال به سراسر کشور، کرایه بر اساس وزن قطعه.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
