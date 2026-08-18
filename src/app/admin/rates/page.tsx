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
      <h1 className="text-lg font-bold">نرخ ارز</h1>
      <p className="pt-1 text-sm text-muted">
        نرخ‌ها به ریال ثبت می‌شوند. با تغییر نرخ، قیمت همه قطعاتی که «وابسته به ارز» هستند و قفل
        نشده‌اند بلافاصله به‌روز می‌شود.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {currencies.map((c) => (
          <form
            key={c.code}
            action={updateRate}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4"
          >
            <input type="hidden" name="code" value={c.code} />
            <div className="min-w-28">
              <div className="text-sm font-bold">{c.nameFa}</div>
              <div className="pn text-xs text-faint">{c.code}</div>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">نرخ (ریال)</span>
              <input
                name="rateIrr"
                type="number"
                step="1000"
                defaultValue={Number(c.rateIrr)}
                className="tnum w-44 rounded border border-line px-3 py-2 text-sm"
              />
            </label>
            <div className="text-xs text-faint">
              معادل {formatMoney(Number(c.rateIrr), unit)} {moneyLabel(unit)}
            </div>
            <button
              type="submit"
              className="mr-auto rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              ثبت نرخ
            </button>
          </form>
        ))}
      </div>

      {history.length > 0 ? (
        <section className="mt-8">
          <h2 className="pb-2 text-sm font-bold">تاریخچه تغییر نرخ</h2>
          <div className="overflow-x-auto rounded border border-line bg-surface">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="bg-surface-2 text-xs text-faint">
                  <th className="px-3 py-2 text-right font-medium">ارز</th>
                  <th className="px-3 py-2 text-right font-medium">از</th>
                  <th className="px-3 py-2 text-right font-medium">به</th>
                  <th className="px-3 py-2 text-right font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="pn px-3 py-2">{h.currencyCode}</td>
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
