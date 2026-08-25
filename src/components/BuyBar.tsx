import Link from "next/link";
import type { PricedOffer } from "@/lib/catalog";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { faNumber } from "@/lib/format";
import { addToCart } from "@/app/cart/actions";

/**
 * نوار قیمت و خرید یک قطعه.
 * یک قطعه، یک قیمت: پیشنهاد پیش‌فرض فروشگاه انتخاب می‌شود و مشتری
 * لازم نیست بین چند فروشنده مقایسه کند.
 */
export function BuyBar({
  offers,
  partName,
  partNumber,
  unit,
}: {
  offers: PricedOffer[];
  partName: string;
  partNumber?: string | null;
  unit: "toman" | "rial";
}) {
  const selling =
    offers.find((o) => o.isDefault && o.price.kind === "price") ??
    offers.find((o) => o.price.kind === "price") ??
    offers.find((o) => o.isDefault) ??
    offers[0];

  const price = selling?.price;
  const inStock = (selling?.stockQty ?? 0) > 0;
  const buyable = price?.kind === "price" && inStock;

  const inquiryHref = `/inquiry?part=${encodeURIComponent(partName)}${
    partNumber ? `&pn=${encodeURIComponent(partNumber)}` : ""
  }`;

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        {price?.kind === "price" ? (
          <div className="tnum font-display text-lg font-black">
            {formatMoney(price.amountIrr, unit)}
            <span className="pr-1 text-xs font-medium text-muted">{moneyLabel(unit)}</span>
          </div>
        ) : (
          <div className="font-display text-sm font-bold text-alert">استعلام قیمت</div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1.5 text-xs">
          <span className={inStock ? "text-ok" : "text-faint"}>
            {inStock ? `${faNumber(selling!.stockQty)} عدد موجود` : "ناموجود"}
          </span>
          {selling && selling.leadTimeDays > 0 ? (
            <span className="tnum text-faint">
              {faNumber(selling.leadTimeDays)} روز کاری تا ارسال
            </span>
          ) : null}
          {selling?.brandName ? <span className="text-muted">{selling.brandName}</span> : null}
        </div>
      </div>

      {buyable ? (
        <form action={addToCart}>
          <input type="hidden" name="offerId" value={selling!.id} />
          <input type="hidden" name="qty" value={1} />
          <button type="submit" className="btn btn-brass px-6">
            افزودن به سبد
          </button>
        </form>
      ) : (
        <Link href={inquiryHref} className="btn btn-brass px-6">
          {price?.kind === "price" ? "درخواست تامین" : "استعلام قیمت"}
        </Link>
      )}
    </div>
  );
}
