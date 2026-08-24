import { prisma } from "@/lib/prisma";
import { updateRate } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";

export default async function RatesPage() {
  const [currencies, settings, history] = await Promise.all([
    prisma.currency.findMany({ orderBy: { code: "asc" } }),
    getSettings(),
    prisma.exchangeRateHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  return (
    <div>
      <div className="rule pb-4"><h1 className="font-display text-xl font-black">نرخ ارز</h1></div>
      <p className="pt-1 text-sm text-muted">
        نرخ‌ها به ریال ثبت می‌شوند. با تغییر نرخ، قیمت همه قطعاتی که «وابسته به ارز» هستند و قفل
        نشده‌اند بلافاصله به‌روز می‌شود.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {currencies.map((c) => (
          <form
            key={c.code}
            action={updateRate}
            className="panel flex flex-wrap items-end gap-4 p-5"
          >
            <input type="hidden" name="code" value={c.code} />
            <div className="min-w-28">
              <div className="text-sm font-bold">{c.nameFa}</div>
              <div className="mono text-xs text-faint">{c.code}</div>
            </div>
            <label className="block">
              <span className="field-label">نرخ (ریال)</span>
              <input
                name="rateIrr"
                type="number"
                step="1000"
                defaultValue={Number(c.rateIrr)}
                className="field tnum w-44"
              />
            </label>
            <div className="text-xs text-faint">
              معادل {formatMoney(Number(c.rateIrr), unit)} {moneyLabel(unit)}
            </div>
            <button
              type="submit"
              className="btn btn-brass mr-auto px-4 py-2 text-xs"
            >
              ثبت نرخ
            </button>
          </form>
        ))}
      </div>

      {history.length > 0 ? (
        <section className="mt-8">
          <div className="rule pb-4"><h2 className="font-display text-base font-bold">تاریخچه تغییر نرخ</h2></div>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="bg-steel-2 text-xs text-faint">
                  <th className="px-3 py-2 text-right font-medium">ارز</th>
                  <th className="px-3 py-2 text-right font-medium">از</th>
                  <th className="px-3 py-2 text-right font-medium">به</th>
                  <th className="px-3 py-2 text-right font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="mono px-3 py-2">{h.currencyCode}</td>
                    <td className="tnum px-3 py-2 text-muted">{Number(h.oldRateIrr).toLocaleString("fa-IR")}</td>
                    <td className="tnum px-3 py-2">{Number(h.newRateIrr).toLocaleString("fa-IR")}</td>
                    <td className="px-3 py-2 text-faint">
                      {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(h.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
