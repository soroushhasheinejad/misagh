import Link from "next/link";
import type { PricedOffer } from "@/lib/catalog";
import { formatMoney, moneyLabel } from "@/lib/pricing";

type PartLike = {
  id: string;
  slug: string;
  nameFa: string;
  category?: { nameFa: string } | null;
  numbers?: Array<{ number: string }>;
  images?: Array<{ url: string; alt?: string | null }>;
};

/** کارت محصول — شماره فنی به‌شکل پلاک، قیمت با منشور، وضعیت با رنگ */
export function ProductCard({
  part,
  offers,
  unit,
}: {
  part: PartLike;
  offers: PricedOffer[];
  unit: "toman" | "rial";
}) {
  const best = offers.find((o) => o.price.kind === "price");
  const available = offers.some((o) => o.available);
  const number = part.numbers?.[0]?.number;

  const image = part.images?.[0];

  return (
    <article className="panel group flex flex-col p-5 transition-colors hover:border-brass">
      {image ? (
        <Link href={`/part/${part.slug}`} className="-m-5 mb-4 block overflow-hidden">
          {/* تصویر آپلودی خودمان است؛ نیازی به بهینه‌سازی مسیر خارجی نیست */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt ?? part.nameFa}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        </Link>
      ) : null}

      {part.category ? (
        <div className="text-xs text-faint">
          {part.category.nameFa}
        </div>
      ) : null}

      <Link
        href={`/part/${part.slug}`}
        className="pt-2 font-display text-[0.95rem] font-bold leading-7 group-hover:text-brass-dark"
      >
        {part.nameFa}
      </Link>

      {number ? (
        <div className="pt-3">
          <span className="plate text-xs">{number}</span>
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            {best && best.price.kind === "price" ? (
              <div className="tnum font-display text-lg font-black">
                {formatMoney(best.price.amountIrr, unit)}
                <span className="pr-1 text-[0.7rem] font-medium text-muted">
                  {moneyLabel(unit)}
                </span>
              </div>
            ) : (
              <div className="font-display text-sm font-bold text-alert">استعلام قیمت</div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className={available ? "text-[0.68rem] text-ok" : "text-[0.68rem] text-faint"}>
                {available ? "موجود" : "ناموجود"}
              </span>
            </div>
          </div>

          <Link href={`/part/${part.slug}`} className="btn btn-ghost px-3 py-1.5 text-xs">
            جزئیات
          </Link>
        </div>
      </div>
    </article>
  );
}
