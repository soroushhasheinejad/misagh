import Link from "next/link";
import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { faNumber } from "@/lib/format";
import { updateQty, removeItem, placeOrder } from "@/app/cart/actions";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false },
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  const { added, error } = await searchParams;
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1120px] px-5 py-20 text-center">
        <span className="mx-auto block size-[7px] rotate-45 bg-brass" />
        <h1 className="pt-5 font-display text-xl font-black">سبد خرید خالی است</h1>
        <p className="pt-3 text-muted">
          قطعه‌ای که می‌خواهید را پیدا کنید و به سبد اضافه کنید.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-7">
          <Link href="/catalog" className="btn btn-primary">
            دیدن محصولات
          </Link>
          <Link href="/inquiry" className="btn btn-ghost">
            استعلام قطعه نایاب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10">
      <div className="flex items-center gap-2.5 pb-7">
        <span className="size-[7px] rotate-45 bg-brass" />
        <h1 className="font-display text-xl font-black">سبد خرید</h1>
        <span className="tnum text-sm text-muted">({faNumber(cart.count)} قلم)</span>
      </div>

      {added ? (
        <div className="mb-6 rounded border-r-[3px] border-r-ok bg-ok-soft px-4 py-3 text-sm">
          قطعه به سبد اضافه شد.
        </div>
      ) : null}
      {error === "missing" ? (
        <div className="mb-6 rounded border-r-[3px] border-r-alert bg-alert-soft px-4 py-3 text-sm">
          برای ثبت سفارش، نام، شماره تماس، شهر و نشانی لازم است.
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* اقلام */}
        <div className="flex flex-col gap-3">
          {cart.lines.map((line) => (
            <div key={line.itemId} className="panel flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-[200px] flex-1">
                <Link
                  href={`/part/${line.slug}`}
                  className="font-display text-sm font-bold hover:text-brass-dark"
                >
                  {line.nameFa}
                </Link>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {line.partNumber ? (
                    <span className="plate text-[0.68rem]">{line.partNumber}</span>
                  ) : null}
                  {line.brandName ? (
                    <span className="text-xs text-muted">{line.brandName}</span>
                  ) : null}
                </div>
                <div className="pt-2 text-xs text-faint">
                  {line.leadTimeDays > 0
                    ? `${faNumber(line.leadTimeDays)} روز کاری تا ارسال`
                    : "آماده ارسال"}
                </div>
              </div>

              <form action={updateQty} className="flex items-center gap-2">
                <input type="hidden" name="itemId" value={line.itemId} />
                <input
                  name="qty"
                  type="number"
                  min={1}
                  defaultValue={line.qty}
                  className="field tnum w-20 py-1.5 text-center"
                />
                <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
                  به‌روزرسانی
                </button>
              </form>

              <div className="tnum min-w-28 text-left font-display text-base font-black">
                {formatMoney(line.lineTotalIrr, unit)}
                <span className="pr-1 text-[0.7rem] font-medium text-muted">
                  {moneyLabel(unit)}
                </span>
              </div>

              <form action={removeItem}>
                <input type="hidden" name="itemId" value={line.itemId} />
                <button
                  type="submit"
                  className="text-xs text-muted hover:text-alert"
                  aria-label="حذف از سبد"
                >
                  حذف
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* تسویه */}
        <aside>
          <div className="panel panel-brass p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">جمع اقلام</span>
              <span className="tnum font-display text-lg font-black">
                {formatMoney(cart.subtotalIrr, unit)}
                <span className="pr-1 text-xs font-medium text-muted">{moneyLabel(unit)}</span>
              </span>
            </div>
            <p className="pt-2 text-xs leading-6 text-faint">
              کرایه ارسال بر اساس وزن و مقصد، هنگام تماس هماهنگی محاسبه می‌شود.
            </p>

            <form action={placeOrder} className="mt-6 flex flex-col gap-4 border-t border-line pt-5">
              <div className="font-display text-sm font-bold">مشخصات گیرنده</div>

              <label className="block">
                <span className="field-label">نام و نام خانوادگی *</span>
                <input name="fullName" required className="field" />
              </label>

              <label className="block">
                <span className="field-label">شماره تماس *</span>
                <input name="phone" required placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="field" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">استان</span>
                  <input name="province" className="field" />
                </label>
                <label className="block">
                  <span className="field-label">شهر *</span>
                  <input name="city" required className="field" />
                </label>
              </div>

              <label className="block">
                <span className="field-label">نشانی *</span>
                <textarea name="address" required rows={3} className="field resize-y" />
              </label>

              <label className="block">
                <span className="field-label">توضیح سفارش</span>
                <input name="note" className="field" />
              </label>

              <button type="submit" className="btn btn-brass w-full py-3 text-base">
                ثبت سفارش
              </button>

              <p className="text-xs leading-6 text-muted">
                پس از ثبت، کارشناس ما برای تایید موجودی و هماهنگی پرداخت تماس می‌گیرد. تا آن
                لحظه مبلغی از شما دریافت نمی‌شود.
              </p>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
