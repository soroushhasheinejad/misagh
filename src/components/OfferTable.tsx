import Link from "next/link";
import type { PricedOffer } from "@/lib/catalog";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import type { Settings } from "@/lib/settings";

const BADGE_LABEL: Record<string, string> = {
  recommended: "پیشنهاد ما",
  cheapest: "کمترین قیمت",
  fastest: "زودترین تحویل",
};

const TIER: Record<string, { label: string; className: string }> = {
  GENUINE: { label: "جنیون", className: "tier tier-genuine" },
  OEM_SUPPLIER: { label: "سازنده اصلی", className: "tier tier-oem" },
  HIGH_COPY: { label: "های‌کپی", className: "tier tier-copy" },
  AFTERMARKET: { label: "متفرقه", className: "tier tier-copy" },
  USED: { label: "استوک", className: "tier tier-copy" },
};

function InquiryActions({
  settings,
  partName,
  partNumber,
  compact = false,
}: {
  settings: Settings;
  partName: string;
  partNumber?: string;
  compact?: boolean;
}) {
  const message = encodeURIComponent(
    `سلام، قیمت این قطعه را می‌خواستم:\n${partName}${partNumber ? `\nکد فنی: ${partNumber}` : ""}`,
  );
  const telegram = settings["inquiry.telegramUsername"];
  const whatsapp = settings["inquiry.whatsappNumber"];

  return (
    <div className={compact ? "flex flex-wrap justify-end gap-1.5" : "flex flex-wrap gap-2"}>
      <Link
        href={`/inquiry?part=${encodeURIComponent(partName)}${partNumber ? `&pn=${partNumber}` : ""}`}
        className="btn btn-primary whitespace-nowrap px-4 py-2 text-xs"
      >
        {settings["inquiry.buttonLabelFa"]}
      </Link>
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost px-3 py-2 text-xs"
        >
          واتساپ
        </a>
      ) : null}
      {telegram ? (
        <a
          href={`https://t.me/${telegram}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost px-3 py-2 text-xs"
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
      <div className="panel p-5">
        <p className="text-sm text-muted">برای این قطعه پیشنهاد فعالی ثبت نشده است.</p>
        <div className="pt-3">
          <InquiryActions settings={settings} partName={partName} partNumber={partNumber} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="spec min-w-[620px]">
          <thead>
            <tr>
              <th>برند و کیفیت</th>
              {settings["offers.showStockQty"] ? <th>موجودی</th> : null}
              {settings["offers.showLeadTime"] ? <th>تحویل</th> : null}
              <th>قیمت</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {visible.map((offer) => {
              const tier = offer.qualityTier ? TIER[offer.qualityTier] : null;
              const isRecommended =
                settings["offers.showBadges"] && offer.badges.includes("recommended");

              return (
                <tr key={offer.id} className={isRecommended ? "row-recommended" : undefined}>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold">
                        {offer.brandName ?? "بدون برند"}
                      </span>
                      {tier ? <span className={tier.className}>{tier.label}</span> : null}
                    </div>
                    {settings["offers.showBadges"] && offer.badges.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {offer.badges.map((b) => (
                          <span
                            key={b}
                            className={
                              b === "recommended"
                                ? "font-mono text-[0.62rem] uppercase tracking-[0.12em] text-brass-dark"
                                : "font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint"
                            }
                          >
                            {BADGE_LABEL[b]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {offer.supplierName ? (
                      <div className="pt-1 text-xs text-faint">{offer.supplierName}</div>
                    ) : null}
                  </td>

                  {settings["offers.showStockQty"] ? (
                    <td>
                      {offer.stockQty > 0 ? (
                        <span className="tnum text-ok">{offer.stockQty} عدد</span>
                      ) : (
                        <span className="text-faint">ناموجود</span>
                      )}
                    </td>
                  ) : null}

                  {settings["offers.showLeadTime"] ? (
                    <td className="text-muted">
                      {offer.leadTimeDays === 0 ? (
                        "همین حالا"
                      ) : (
                        <span className="tnum">{offer.leadTimeDays} روز</span>
                      )}
                    </td>
                  ) : null}

                  <td>
                    {offer.price.kind === "price" ? (
                      <div>
                        <div className="tnum font-display text-base font-black">
                          {formatMoney(offer.price.amountIrr, unit)}
                          <span className="pr-1 text-[0.7rem] font-medium text-muted">
                            {moneyLabel(unit)}
                          </span>
                        </div>
                        {offer.price.originalIrr ? (
                          <div className="tnum text-xs text-faint line-through">
                            {formatMoney(offer.price.originalIrr, unit)}
                          </div>
                        ) : null}
                        {offer.price.validUntil && settings["pricing.showPriceValidity"] ? (
                          <div className="pt-0.5 text-[0.68rem] text-faint">
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
                      <span className="font-display text-sm font-bold text-alert">
                        {offer.price.reason === "out-of-stock" ? "ناموجود" : "استعلام قیمت"}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  <td className="text-left">
                    {offer.price.kind === "price" && offer.stockQty > 0 ? (
                      <button type="button" className="btn btn-brass whitespace-nowrap px-4 py-2 text-xs">
                        افزودن به سبد
                      </button>
                    ) : (
                      <InquiryActions
                        settings={settings}
                        partName={partName}
                        partNumber={partNumber}
                        compact
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hidden > 0 ? (
        <div className="border-t border-line-2 bg-steel-2 px-4 py-2.5 text-xs text-muted">
          {hidden} پیشنهاد دیگر برای این قطعه ثبت شده است.
        </div>
      ) : null}
    </div>
  );
}
