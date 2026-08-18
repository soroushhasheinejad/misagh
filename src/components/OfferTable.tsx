import Link from "next/link";
import type { PricedOffer } from "@/lib/catalog";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import type { Settings } from "@/lib/settings";

const BADGE_LABEL: Record<string, string> = {
  recommended: "پیشنهاد ما",
  cheapest: "ارزان‌ترین",
  fastest: "سریع‌ترین",
};

const TIER_LABEL: Record<string, string> = {
  GENUINE: "جنیون",
  OEM_SUPPLIER: "سازنده اصلی",
  HIGH_COPY: "های‌کپی",
  AFTERMARKET: "متفرقه",
  USED: "استوک",
};

function InquiryButton({
  settings,
  partName,
  partNumber,
}: {
  settings: Settings;
  partName: string;
  partNumber?: string;
}) {
  const text = encodeURIComponent(
    `سلام، قیمت این قطعه را می‌خواستم:\n${partName}${partNumber ? `\nکد فنی: ${partNumber}` : ""}`,
  );
  const telegram = settings["inquiry.telegramUsername"];
  const whatsapp = settings["inquiry.whatsappNumber"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/inquiry?part=${encodeURIComponent(partName)}${partNumber ? `&pn=${partNumber}` : ""}`}
        className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
      >
        {settings["inquiry.buttonLabelFa"]}
      </Link>
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}?text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
        >
          واتساپ
        </a>
      ) : null}
      {telegram ? (
        <a
          href={`https://t.me/${telegram}?text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
        >
          تلگرام
        </a>
      ) : null}
    </div>
  );
}

export function OfferTable({
  offers,
  settings,
  partName,
  partNumber,
}: {
  offers: PricedOffer[];
  settings: Settings;
  partName: string;
  partNumber?: string;
}) {
  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const maxVisible = Number(settings["offers.maxVisible"] ?? 4);
  const visible = offers.slice(0, maxVisible);
  const hidden = offers.length - visible.length;

  if (offers.length === 0) {
    return (
      <div className="rounded border border-line bg-surface-2 p-4 text-sm text-muted">
        در حال حاضر پیشنهاد فعالی برای این قطعه ثبت نشده است.
        <div className="mt-3">
          <InquiryButton settings={settings} partName={partName} partNumber={partNumber} />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-line bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="bg-surface-2 text-xs text-faint">
            <th className="px-3 py-2 text-right font-medium">برند / کیفیت</th>
            {settings["offers.showStockQty"] ? (
              <th className="px-3 py-2 text-right font-medium">موجودی</th>
            ) : null}
            {settings["offers.showLeadTime"] ? (
              <th className="px-3 py-2 text-right font-medium">زمان تحویل</th>
            ) : null}
            <th className="px-3 py-2 text-right font-medium">قیمت</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {visible.map((offer) => (
            <tr key={offer.id} className="border-t border-line align-middle">
              <td className="px-3 py-3">
                <div className="font-medium">{offer.brandName ?? "بدون برند"}</div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {offer.qualityTier ? (
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                      {TIER_LABEL[offer.qualityTier] ?? offer.qualityTier}
                    </span>
                  ) : null}
                  {settings["offers.showBadges"] &&
                    offer.badges.map((b) => (
                      <span
                        key={b}
                        className={
                          b === "cheapest"
                            ? "rounded bg-ok-soft px-1.5 py-0.5 text-[11px] text-ok"
                            : b === "fastest"
                              ? "rounded bg-signal-soft px-1.5 py-0.5 text-[11px] text-signal"
                              : "rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent-dark"
                        }
                      >
                        {BADGE_LABEL[b]}
                      </span>
                    ))}
                  {offer.supplierName ? (
                    <span className="text-[11px] text-faint">{offer.supplierName}</span>
                  ) : null}
                </div>
              </td>

              {settings["offers.showStockQty"] ? (
                <td className="tnum px-3 py-3 text-muted">
                  {offer.stockQty > 0 ? `${offer.stockQty} عدد` : "ناموجود"}
                </td>
              ) : null}

              {settings["offers.showLeadTime"] ? (
                <td className="tnum px-3 py-3 text-muted">
                  {offer.leadTimeDays === 0 ? "موجود در انبار" : `${offer.leadTimeDays} روز`}
                </td>
              ) : null}

              <td className="px-3 py-3">
                {offer.price.kind === "price" ? (
                  <div>
                    <div className="tnum font-bold">
                      {formatMoney(offer.price.amountIrr, unit)}{" "}
                      <span className="text-xs font-normal text-muted">{moneyLabel(unit)}</span>
                    </div>
                    {offer.price.originalIrr ? (
                      <div className="tnum text-xs text-faint line-through">
                        {formatMoney(offer.price.originalIrr, unit)}
                      </div>
                    ) : null}
                    {offer.price.validUntil && settings["pricing.showPriceValidity"] ? (
                      <div className="pt-0.5 text-[11px] text-faint">
                        معتبر تا{" "}
                        {new Intl.DateTimeFormat("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "long",
                        }).format(offer.price.validUntil)}
                      </div>
                    ) : null}
                  </div>
                ) : offer.price.kind === "inquiry" ? (
                  <span className="text-sm text-signal">
                    {offer.price.reason === "out-of-stock" ? "ناموجود — استعلام" : "استعلام قیمت"}
                  </span>
                ) : (
                  <span className="text-sm text-faint">—</span>
                )}
              </td>

              <td className="px-3 py-3 text-left">
                {offer.price.kind === "price" && offer.stockQty > 0 ? (
                  <button
                    type="button"
                    className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
                  >
                    افزودن به سبد
                  </button>
                ) : (
                  <InquiryButton
                    settings={settings}
                    partName={partName}
                    partNumber={partNumber}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hidden > 0 ? (
        <div className="border-t border-line px-3 py-2 text-sm text-accent">
          {hidden} پیشنهاد دیگر برای این قطعه موجود است
        </div>
      ) : null}
    </div>
  );
}
