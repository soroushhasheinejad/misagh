import Link from "next/link";
import type { Metadata } from "next";
import { decodeVinWithRules } from "@/lib/vin";
import { prisma } from "@/lib/prisma";
import { faYear, faYearRange } from "@/lib/format";
import { VinSearchBox } from "@/components/VinSearchBox";

export const metadata: Metadata = {
  title: "تشخیص خودرو با شماره شاسی",
  description:
    "شماره شاسی ۱۷ رقمی کیا یا هیوندا را وارد کنید تا برند، سال ساخت و کارخانه مونتاژ خوانده شود و قطعات همان خودرو را ببینید.",
};

export default async function VinPage({
  searchParams,
}: {
  searchParams: Promise<{ vin?: string }>;
}) {
  const { vin } = await searchParams;
  // قاعده‌های جدول VinRule روی نگاشت داخلی اولویت دارند و از پنل مدیریت می‌شوند
  const info = vin ? await decodeVinWithRules(vin) : null;

  // خودروهای محتملِ همان برند و سال، مرتب بر اساس تعداد قطعه‌ای که داریم
  const make =
    info?.makeSlug && info.modelYear
      ? await prisma.vehicleMake.findUnique({
          where: { slug: info.makeSlug },
          include: {
            models: {
              where: { isActive: true },
              include: {
                generations: {
                  where: {
                    isActive: true,
                    yearStart: { lte: info.modelYear },
                    OR: [{ yearEnd: null }, { yearEnd: { gte: info.modelYear } }],
                  },
                  include: { _count: { select: { fitments: true } } },
                },
              },
            },
          },
        })
      : null;

  const candidates = (make?.models ?? [])
    .flatMap((model) => model.generations.map((generation) => ({ model, generation })))
    .sort((a, b) => b.generation._count.fitments - a.generation._count.fitments);

  return (
    <div>
      {/* ---------------------------- ورودی ---------------------------- */}
      <section className="border-b border-brass/25 bg-carbon py-12 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
                    <h1 className="pt-4 font-display text-3xl font-black">تشخیص خودرو با شماره شاسی</h1>
          <p className="max-w-lg pt-3 leading-8 text-white/60">
            وقتی از نسل و سال دقیق خودرو مطمئن نیستید، شماره شاسی جواب می‌دهد. روی کارت خودرو،
            بیمه‌نامه، یا زیر شیشه جلو نوشته شده است.
          </p>

          <div className="max-w-xl pt-6 text-ink">
            <VinSearchBox defaultValue={info?.vin ?? ""} autoFocus={!vin} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        {/* --------------------------- بدون ورودی ------------------------- */}
        {!info ? (
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="rule pb-5">
                <h2 className="font-display text-lg font-black">شماره شاسی چه چیزی را می‌گوید</h2>
              </div>

              <div className="overflow-x-auto rounded-md border border-line bg-surface">
                <table className="spec min-w-[520px]">
                  <thead>
                    <tr>
                      <th>جایگاه</th>
                      <th>معنی</th>
                      <th>مثال</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tnum">۱ تا ۳</td>
                      <td className="text-muted">سازنده و کشور</td>
                      <td className="mono">KMH = هیوندای کره</td>
                    </tr>
                    <tr>
                      <td className="tnum">۴ تا ۸</td>
                      <td className="text-muted">مدل، بدنه و موتور</td>
                      <td className="mono">—</td>
                    </tr>
                    <tr>
                      <td className="tnum">۹</td>
                      <td className="text-muted">رقم کنترلی — غلط تایپی را لو می‌دهد</td>
                      <td className="mono">—</td>
                    </tr>
                    <tr>
                      <td className="tnum">۱۰</td>
                      <td className="text-muted">سال ساخت</td>
                      <td className="mono">B = ۲۰۱۱</td>
                    </tr>
                    <tr>
                      <td className="tnum">۱۱</td>
                      <td className="text-muted">کارخانه مونتاژ</td>
                      <td className="mono">U = اولسان</td>
                    </tr>
                    <tr>
                      <td className="tnum">۱۲ تا ۱۷</td>
                      <td className="text-muted">شماره سریال خودرو</td>
                      <td className="mono">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="max-w-[68ch] pt-5 leading-8 text-muted">
                ما از این شماره برند، سال ساخت و کارخانه را می‌خوانیم. رسیدن به تیپ و موتور دقیق
                نیاز به جدول دکد کامل سازنده دارد که لایسنس جدا می‌خواهد؛ برای همین مدل‌های محتمل را
                نشان می‌دهیم تا خودتان انتخاب کنید.
              </p>
            </div>

            <aside>
              <div className="panel panel-brass p-5">
                <div className="font-display text-sm font-bold">شماره شاسی را کجا ببینم؟</div>
                <ul className="list-disc space-y-2 pr-5 pt-3 text-xs leading-6 text-muted marker:text-brass">
                  <li>کارت خودرو و برگ سبز</li>
                  <li>بیمه‌نامه شخص ثالث</li>
                  <li>پلاک فلزی گوشه پایین شیشه جلو</li>
                  <li>برچسب لبه درب سمت راننده</li>
                </ul>
              </div>

              <div className="panel mt-4 p-5">
                <div className="font-display text-sm font-bold">راه‌های دیگر</div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <Link href="/catalog" className="btn btn-ghost px-3 py-1.5 text-xs">
                    انتخاب خودرو
                  </Link>
                  <Link href="/search" className="btn btn-ghost px-3 py-1.5 text-xs">
                    شماره فنی
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {/* --------------------------- خطای ساختاری ----------------------- */}
        {info && !info.valid ? (
          <div className="panel border-r-[3px] border-r-alert bg-alert-soft p-5">
            <div className="font-display text-sm font-bold text-alert">{info.error}</div>
            <p className="pt-2 text-sm text-muted">
              شماره شاسی دقیقاً ۱۷ کاراکتر است و فقط عدد و حرف انگلیسی دارد.
            </p>
          </div>
        ) : null}

        {/* --------------------------- نتیجه دکد -------------------------- */}
        {info?.valid ? (
          <>
            <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "کد سازنده", value: info.wmi ?? "—", mono: true },
                { label: "برند", value: info.makeName ?? "خارج از پوشش ما", mono: false },
                {
                  label: "سال ساخت",
                  value: info.modelYear ? String(info.modelYear) : "نامشخص",
                  mono: false,
                },
                { label: "کارخانه", value: info.plant ?? "نامشخص", mono: false },
              ].map((cell) => (
                <div key={cell.label} className="bg-surface p-5">
                  <div className="text-xs text-faint">
                    {cell.label}
                  </div>
                  <div
                    className={
                      cell.mono
                        ? "mono pt-2 text-lg font-bold"
                        : "tnum pt-2 font-display text-lg font-black"
                    }
                  >
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>

            {/* هشدارها */}
            <div className="flex flex-col gap-3 pt-5">
              {info.warning ? (
                <div className="panel border-r-[3px] border-r-brass bg-brass-soft p-4 text-sm">
                  {info.warning}
                </div>
              ) : null}

              {info.error ? (
                <div className="panel border-r-[3px] border-r-alert bg-alert-soft p-4">
                  <div className="text-sm font-bold text-alert">{info.error}</div>
                  <p className="pt-1 text-sm text-muted">
                    ما فقط قطعات کیا و هیوندا داریم. اگر مطمئنید خودرو کره‌ای است، شماره را دوباره
                    چک کنید یا با ما تماس بگیرید.
                  </p>
                </div>
              ) : null}

              {info.yearAmbiguous && info.modelYear ? (
                <p className="text-xs text-faint">
                  حرف سال هر ۳۰ سال تکرار می‌شود؛ {info.modelYear} بر اساس خودروهای رایج بازار
                  خوانده شده است.
                </p>
              ) : null}
            </div>

            {/* خودروهای محتمل */}
            {candidates.length > 0 ? (
              <section className="pt-10">
                <div className="rule pb-2">
                  <h2 className="font-display text-lg font-black">
                    خودروی شما کدام است؟
                  </h2>
                </div>
                <p className="pb-5 text-sm text-muted">
                  این‌ها {info.makeName}‌هایی هستند که در {info.modelYear} تولید می‌شدند. یکی را
                  انتخاب کنید تا قطعات سازگارش را ببینید — عدد کنار هر گزینه تعداد قطعه‌ای است که
                  برایش داریم.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {candidates.map(({ model, generation }) => (
                    <Link
                      key={generation.id}
                      href={`/catalog?generationId=${generation.id}`}
                      className="panel flex items-center justify-between gap-3 p-4 transition-colors hover:border-brass"
                    >
                      <div>
                        <div className="font-display text-sm font-bold">
                          {info.makeName} {model.nameFa} {generation.nameFa}
                        </div>
                        <div className="tnum pt-1 text-xs text-faint">
                          {faYearRange(generation.yearStart, generation.yearEnd)}
                        </div>
                      </div>
                      <span className="tnum text-xs text-brass-dark">
                        {generation._count.fitments.toLocaleString("fa-IR")}
                      </span>
                    </Link>
                  ))}
                </div>

                {info.modelHint ? (
                  <p className="pt-5 text-sm leading-8 text-muted">
                    بر اساس قاعده ثبت‌شده برای این شماره، خودرو احتمالاً{" "}
                    <span className="font-bold text-ink">{info.modelHint}</span> است.
                    {info.ruleNote ? ` ${info.ruleNote}` : ""}
                  </p>
                ) : null}

                <p className="pt-5 text-xs text-faint">
                  تیپ و موتور دقیق با جدول دکد کامل سازنده مشخص می‌شود؛ اینجا تا سطح مدل و سال
                  تشخیص داده می‌شود.
                </p>
              </section>
            ) : info.makeSlug ? (
              <div className="panel mt-8 p-6">
                <div className="font-display text-base font-bold">
                  برای این سال، خودرویی در کاتالوگ ما ثبت نشده
                </div>
                <p className="max-w-[68ch] pt-2 leading-8 text-muted">
                  شماره شاسی درست خوانده شد ولی مدلی از {info.makeName} با سال {info.modelYear} در
                  کاتالوگ نداریم. قطعه‌اش را می‌توانیم تامین کنیم؛ درخواستتان را ثبت کنید.
                </p>
                <div className="flex flex-wrap gap-3 pt-5">
                  <Link
                    href={`/inquiry?part=${encodeURIComponent(`شماره شاسی ${info.vin}`)}`}
                    className="btn btn-brass"
                  >
                    درخواست قطعه
                  </Link>
                  <Link href="/vehicles" className="btn btn-ghost">
                    فهرست خودروهای موجود
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
