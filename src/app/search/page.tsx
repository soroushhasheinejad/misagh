import Link from "next/link";
import { searchByOem } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { OfferTable } from "@/components/OfferTable";
import { formatPartNumber } from "@/lib/normalize";

const MATCH_LABEL: Record<string, string> = {
  exact: "تطابق دقیق",
  cross: "کد معادل",
  superseded: "کد جایگزین‌شده",
  partial: "تطابق جزئی",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const settings = await getSettings();

  if (!q) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-muted">شماره فنی مورد نظر را وارد کنید.</p>
      </div>
    );
  }

  const result = await searchByOem(q);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-bold">نتیجه جستجوی شماره فنی</h1>

      <div className="mt-4 rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="pn text-base font-bold">{formatPartNumber(result.query)}</span>
          {result.matches.length > 0 ? (
            <span className="text-muted">
              {result.directCount} تطابق مستقیم و {result.equivalentCount} کد معادل پیدا شد
            </span>
          ) : (
            <span className="text-signal">نتیجه‌ای پیدا نشد</span>
          )}
        </div>

        {result.matches.length === 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm">
            <span className="text-muted">دنبال قطعه دیگری هستید؟</span>
            <Link
              href={`/inquiry?pn=${encodeURIComponent(result.query)}`}
              className="rounded bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-dark"
            >
              ثبت درخواست این قطعه
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {result.matches.map((match) => (
          <section key={match.part.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-faint">{MATCH_LABEL[match.matchType]}</div>
                <h2 className="pt-1 font-bold">
                  <Link href={`/part/${match.part.slug}`} className="hover:text-accent">
                    {match.part.nameFa}
                  </Link>
                </h2>
                <div className="flex flex-wrap gap-2 pt-2">
                  {match.numbers.map((n) => (
                    <span
                      key={n.number}
                      className="pn rounded bg-surface-2 px-2 py-0.5 text-xs text-muted"
                    >
                      {n.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <OfferTable
                offers={match.offers}
                settings={settings}
                partName={match.part.nameFa}
                partNumber={match.matchedNumber}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
