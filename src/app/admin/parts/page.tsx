import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { priceOffers } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";

const MODE_LABEL: Record<string, string> = {
  FIXED: "ثابت",
  CURRENCY_LINKED: "ارزی",
  INQUIRY: "استعلام",
  HIDDEN: "بدون قیمت",
};

export default async function AdminPartsPage() {
  const settings = await getSettings();
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  const parts = await prisma.part.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      numbers: { where: { isPrimary: true }, take: 1 },
      offers: { where: { status: { not: "DISABLED" } }, include: { brand: true, supplier: true } },
    },
    take: 100,
  });

  const rows = await Promise.all(
    parts.map(async (p) => ({ part: p, offers: await priceOffers(p, p.offers, { settings }) })),
  );

  return (
    <div>
      <h1 className="text-lg font-bold">قطعات و قیمت</h1>
      <p className="pt-1 text-sm text-muted">
        برای هر قطعه می‌توانید حالت قیمت‌گذاری، حاشیه سود، قفل قیمت و پیشنهادهایش را جداگانه تنظیم کنید.
      </p>

      <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-surface-2 text-xs text-faint">
              <th className="px-3 py-2 text-right font-medium">قطعه</th>
              <th className="px-3 py-2 text-right font-medium">شماره فنی</th>
              <th className="px-3 py-2 text-right font-medium">حالت قیمت</th>
              <th className="px-3 py-2 text-right font-medium">پیشنهادها</th>
              <th className="px-3 py-2 text-right font-medium">کمترین قیمت</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ part, offers }) => {
              const priced = offers.filter((o) => o.price.kind === "price");
              const min = priced.length
                ? Math.min(...priced.map((o) => (o.price as { amountIrr: number }).amountIrr))
                : null;
              return (
                <tr key={part.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <div className="font-medium">{part.nameFa}</div>
                    <div className="text-xs text-faint">{part.category.nameFa}</div>
                  </td>
                  <td className="pn px-3 py-2 text-muted">{part.numbers[0]?.number ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">
                    {part.priceMode ? MODE_LABEL[part.priceMode] : "ارث از تنظیمات"}
                    {part.priceLocked ? <span className="pr-1 text-xs text-signal">(قفل)</span> : null}
                  </td>
                  <td className="tnum px-3 py-2 text-muted">{part.offers.length}</td>
                  <td className="tnum px-3 py-2">
                    {min !== null ? (
                      <>
                        {formatMoney(min, unit)}{" "}
                        <span className="text-xs text-muted">{moneyLabel(unit)}</span>
                      </>
                    ) : (
                      <span className="text-signal">استعلام</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-left">
                    <Link
                      href={`/admin/parts/${part.id}`}
                      className="rounded border border-line px-3 py-1.5 text-xs hover:border-accent hover:text-accent"
                    >
                      ویرایش قیمت
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
