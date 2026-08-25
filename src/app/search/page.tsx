import Link from "next/link";
import type { Metadata } from "next";
import { searchByOem, suggestSameGroup, getPopularSearches } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { BuyBar } from "@/components/BuyBar";
import { OemSearchBox } from "@/components/OemSearchBox";
import { formatPartNumber, normalizePartNumber } from "@/lib/normalize";
import { formatMoney, moneyLabel } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "جستجوی شماره فنی",
  description:
    "شماره فنی قطعه کیا و هیوندا را وارد کنید تا قطعه، کدهای معادل و کدهای جایگزین‌شده را ببینید.",
};

const MATCH: Record<string, { label: string; tone: string; note: string }> = {
  exact: {
    label: "تطابق دقیق",
    tone: "text-ok",
    note: "همان کدی که جستجو کردید",
  },
  superseded: {
    label: "کد جایگزین‌شده",
    tone: "text-brass-dark",
    note: "سازنده این کد را با کد دیگری عوض کرده است",
  },
  cross: {
    label: "کد معادل",
    tone: "text-muted",
    note: "قطعه هم‌ارز از برند دیگر",
  },
  partial: {
    label: "تطابق جزئی",
    tone: "text-faint",
    note: "کد کامل وارد نشده؛ این نتیجه با ابتدای کد می‌خواند",
  },
};

/** نمونه‌های واقعی از کاتالوگ خودمان برای صفحه خالی */
const EXAMPLES = [
  { code: "58101-D3A00", label: "لنت ترمز جلو" },
  { code: "26300-35504", label: "فیلتر روغن" },
  { code: "54650-F2AA0", label: "کمک فنر جلو" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const settings = await getSettings();
  const normalized = q ? normalizePartNumber(q) : "";

  // ---------------------------- صفحه خالی ----------------------------------
  if (!q || normalized.length < 3) {
    const popular = await getPopularSearches(8);

    return (
      <div>
        <section className="border-b border-brass/25 bg-carbon py-14 text-white">
          <div className="mx-auto max-w-[1120px] px-5">
                        <h1 className="pt-4 font-display text-3xl font-black">جستجوی شماره فنی</h1>
            <p className="max-w-lg pt-3 leading-8 text-white/60">
              کد روی جعبه یا خود قطعه را وارد کنید. کدهای معادل و کدهای از رده خارج هم پیدا
              می‌شوند.
            </p>

            <div className="max-w-xl pt-6 text-ink">
              <OemSearchBox defaultValue={q ?? ""} autoFocus />
            </div>

            {q && normalized.length < 3 ? (
              <p className="pt-1 text-xs text-brass-lite">
                کد وارد شده کوتاه است؛ حداقل سه کاراکتر لازم داریم.
              </p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-[1120px] px-5 py-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="rule pb-5">
                <h2 className="font-display text-lg font-black">شماره فنی را کجا پیدا کنم؟</h2>
              </div>
              <ul className="max-w-[68ch] list-disc space-y-2 pr-6 leading-8 text-muted marker:text-brass">
                <li>روی برچسب یا حکاکی خود قطعه، معمولاً در سمتی که دیده نمی‌شود</li>
                <li>روی جعبه قطعه قبلی، اگر نگهش داشته‌اید</li>
                <li>در فاکتور تعمیرگاه یا نمایندگی</li>
                <li>اگر هیچ‌کدام را ندارید، از انتخاب خودرو یا شماره شاسی شروع کنید</li>
              </ul>

              <div className="rule pb-5 pt-10">
                <h2 className="font-display text-lg font-black">چند نمونه برای امتحان</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {EXAMPLES.map((ex) => (
                  <Link
                    key={ex.code}
                    href={`/search?q=${encodeURIComponent(ex.code)}`}
                    className="panel p-4 transition-colors hover:border-brass"
                  >
                    <span className="plate text-xs">{ex.code}</span>
                    <div className="pt-3 text-sm text-muted">{ex.label}</div>
                  </Link>
                ))}
              </div>

              <div className="panel mt-10 bg-steel-2 p-6">
                <div className="font-display text-base font-bold">
                  ساختار شماره فنی کیا و هیوندا
                </div>
                <p className="max-w-[68ch] pt-2 leading-8 text-muted">
                  پنج رقم اول نوع قطعه است و دو کاراکتر بعدی کد خودرو. یعنی از روی کد می‌شود فهمید
                  قطعه چیست و مال کدام خودروست.
                </p>
                <Link
                  href="/blog/reading-kia-hyundai-part-numbers"
                  className="mt-3 inline-block text-sm text-brass-dark link-brass"
                >
                  راهنمای کامل خواندن شماره فنی ←
                </Link>
              </div>
            </div>

            <aside>
              {popular.length > 0 ? (
                <>
                  <div className="font-display text-sm font-bold">پرجستجوترین کدها</div>
                  <div className="flex flex-col gap-2 pt-3">
                    {popular.map((p) => (
                      <Link
                        key={p.query}
                        href={`/search?q=${encodeURIComponent(p.query)}`}
                        className="flex items-center justify-between gap-2 border-b border-line-2 pb-2 last:border-b-0"
                      >
                        <span className="plate text-[0.7rem]">{formatPartNumber(p.query)}</span>
                        <span className="tnum font-mono text-[0.65rem] text-faint">{p.count}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="panel panel-brass mt-8 p-5">
                <div className="font-display text-sm font-bold">کد ندارید؟</div>
                <p className="pt-2 text-xs leading-6 text-muted">
                  با انتخاب خودرو یا شماره شاسی هم می‌شود به قطعه رسید.
                </p>
                <div className="flex flex-wrap gap-2 pt-4">
                  <Link href="/catalog" className="btn btn-ghost px-3 py-1.5 text-xs">
                    انتخاب خودرو
                  </Link>
                  <Link href="/vin" className="btn btn-ghost px-3 py-1.5 text-xs">
                    شماره شاسی
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------- صفحه نتیجه ---------------------------------
  const result = await searchByOem(q);
  const found = result.matches.length > 0;
  const suggestions = found ? [] : await suggestSameGroup(q);
  const unit = settings["store.displayUnit"] as "toman" | "rial";

  return (
    <div>
      <section className="border-b border-brass/25 bg-carbon py-8 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="plate plate-dark plate-lg">{formatPartNumber(result.query)}</span>
              <div>
                {found ? (
                  <>
                    <div className="font-display text-sm font-bold">
                      <span className="tnum">{result.directCount.toLocaleString("fa-IR")}</span>{" "}
                      تطابق مستقیم
                      {result.equivalentCount > 0 ? (
                        <>
                          {" و "}
                          <span className="tnum">
                            {result.equivalentCount.toLocaleString("fa-IR")}
                          </span>{" "}
                          کد معادل
                        </>
                      ) : null}
                    </div>
                    <div className="pt-0.5 text-xs text-white/45">
                      کدهای معادل از کاتالوگ سازنده و تجربه فروش استخراج شده‌اند.
                    </div>
                  </>
                ) : (
                  <div className="font-display text-sm font-bold text-brass-lite">
                    این کد در کاتالوگ ما نیست
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-sm text-ink lg:w-80">
              <OemSearchBox defaultValue={result.query} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        {/* نتیجه‌ای نبود: مسیر جایگزین */}
        {!found ? (
          <div className="panel panel-brass p-6">
            <div className="font-display text-base font-bold">این کد را نداریم، ولی می‌آوریمش</div>
            <p className="max-w-[68ch] pt-2 leading-8 text-muted">
              کد را برای ما بفرستید؛ موجودی تامین‌کننده‌ها را چک می‌کنیم و قیمت و زمان تحویل را
              همان روز اعلام می‌کنیم.
            </p>
            <div className="flex flex-wrap gap-3 pt-5">
              <Link
                href={`/inquiry?pn=${encodeURIComponent(result.query)}`}
                className="btn btn-brass"
              >
                درخواست این قطعه
              </Link>
              <Link
                href={`/catalog?q=${encodeURIComponent(result.query)}`}
                className="btn btn-ghost"
              >
                جستجو در نام قطعات
              </Link>
            </div>
          </div>
        ) : null}

        {/* قطعات هم‌گروه — پنج رقم اول یکی است */}
        {suggestions.length > 0 ? (
          <section className="pt-10">
            <div className="rule pb-2">
              <h2 className="font-display text-base font-bold">قطعات هم‌گروه</h2>
            </div>
            <p className="pb-5 text-sm text-muted">
              پنج رقم اول این کد یعنی همین نوع قطعه. این‌ها را برای خودروهای دیگر داریم — شاید کد
              خودروی شما را اشتباه خوانده باشید.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map(({ part, offers, vehicle }) => {
                const best = offers.find((o) => o.price.kind === "price");
                return (
                  <Link
                    key={part.id}
                    href={`/part/${part.slug}`}
                    className="panel p-4 transition-colors hover:border-brass"
                  >
                    <div className="font-display text-sm font-bold leading-7">{part.nameFa}</div>
                    {vehicle ? <div className="pt-1 text-xs text-faint">{vehicle}</div> : null}
                    {part.numbers[0] ? (
                      <div className="pt-3">
                        <span className="plate text-[0.7rem]">{part.numbers[0].number}</span>
                      </div>
                    ) : null}
                    <div className="tnum pt-3 font-display text-sm font-bold">
                      {best && best.price.kind === "price" ? (
                        <>
                          {formatMoney(best.price.amountIrr, unit)}
                          <span className="pr-1 text-[0.65rem] font-medium text-muted">
                            {moneyLabel(unit)}
                          </span>
                        </>
                      ) : (
                        <span className="text-alert">استعلام قیمت</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* نتایج اصلی */}
        <div className="flex flex-col gap-10">
          {result.matches.map((match) => {
            const meta = MATCH[match.matchType];
            return (
              <section key={match.part.id}>
                <div className="rule pb-3">
                  <span
                    className={`text-xs ${meta.tone}`}
                  >
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
                        <span
                          key={n.number}
                          className={
                            normalizePartNumber(n.number) === result.normalized
                              ? "plate border-brass text-xs"
                              : "plate text-xs"
                          }
                        >
                          {n.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <BuyBar
                  offers={match.offers}
                  partName={match.part.nameFa}
                  partNumber={match.matchedNumber}
                  unit={settings["store.displayUnit"] as "toman" | "rial"}
                  telegram={String(settings["inquiry.telegramUsername"] ?? "").trim() || undefined}
                />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
