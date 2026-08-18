import Link from "next/link";
import { searchByOem } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { OfferTable } from "@/components/OfferTable";
import { formatPartNumber } from "@/lib/normalize";

const MATCH: Record<string, { label: string; tone: string }> = {
  exact: { label: "تطابق دقیق", tone: "text-ok" },
  superseded: { label: "کد جایگزین‌شده", tone: "text-brass-dark" },
  cross: { label: "کد معادل", tone: "text-muted" },
  partial: { label: "تطابق جزئی", tone: "text-faint" },
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
      <div className="mx-auto max-w-[1120px] px-5 py-16">
        <h1 className="font-display text-xl font-black">جستجوی شماره فنی</h1>
        <p className="pt-2 text-sm text-muted">
          شماره فنی را از روی جعبه یا خود قطعه بخوانید و در صفحه اصلی وارد کنید.
        </p>
        <Link href="/" className="btn btn-primary mt-5">
          بازگشت به جستجو
        </Link>
      </div>
    );
  }

  const result = await searchByOem(q);
  const found = result.matches.length > 0;

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10">
      {/* سرصفحه نتیجه */}
      <div className="panel panel-brass p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="plate plate-lg">{formatPartNumber(result.query)}</span>
            <div>
              {found ? (
                <>
                  <div className="font-display text-sm font-bold">
                    <span className="tnum">{result.directCount}</span> تطابق مستقیم و{" "}
                    <span className="tnum">{result.equivalentCount}</span> کد معادل
                  </div>
                  <div className="pt-0.5 text-xs text-faint">
                    کدهای معادل از کاتالوگ سازنده و تجربه فروش استخراج شده‌اند.
                  </div>
                </>
              ) : (
                <div className="font-display text-sm font-bold text-alert">
                  این کد در انبار ما ثبت نشده است
                </div>
              )}
            </div>
          </div>

          {!found ? (
            <Link href={`/inquiry?pn=${encodeURIComponent(result.query)}`} className="btn btn-brass">
              درخواست این قطعه
            </Link>
          ) : null}
        </div>
      </div>

      {/* نتایج */}
      <div className="flex flex-col gap-8 pt-8">
        {result.matches.map((match) => {
          const meta = MATCH[match.matchType];
          return (
            <section key={match.part.id}>
              <div className="rule pb-3">
                <span className={`font-mono text-[0.66rem] uppercase tracking-[0.16em] ${meta.tone}`}>
                  {meta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
                <div>
                  <h2 className="font-display text-base font-bold">
                    <Link href={`/part/${match.part.slug}`} className="link-brass">
                      {match.part.nameFa}
                    </Link>
                  </h2>
                  <div className="flex flex-wrap gap-2 pt-3">
                    {match.numbers.map((n) => (
                      <span key={n.number} className="plate text-xs">
                        {n.number}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <OfferTable
                offers={match.offers}
                settings={settings}
                partName={match.part.nameFa}
                partNumber={match.matchedNumber}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
