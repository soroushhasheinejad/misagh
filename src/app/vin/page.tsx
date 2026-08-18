import Link from "next/link";
import { decodeVin } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";

export default async function VinPage({
  searchParams,
}: {
  searchParams: Promise<{ vin?: string }>;
}) {
  const { vin } = await searchParams;

  if (!vin) {
    return (
      <div className="mx-auto max-w-[1120px] px-5 py-16">
        <h1 className="font-display text-xl font-black">تشخیص خودرو از شماره شاسی</h1>
        <p className="max-w-lg pt-3 text-muted">
          شماره شاسی ۱۷ رقمی روی کارت خودرو یا زیر شیشه جلو درج شده است. آن را در صفحه اصلی وارد
          کنید تا برند و سال ساخت خوانده شود.
        </p>
        <Link href="/" className="btn btn-primary mt-5">
          بازگشت به جستجو
        </Link>
      </div>
    );
  }

  const info = decodeVin(vin);
  const make = info.makeSlug
    ? await prisma.vehicleMake.findUnique({
        where: { slug: info.makeSlug },
        include: { models: { include: { generations: true } } },
      })
    : null;

  const candidates =
    make && info.modelYear
      ? make.models.flatMap((m) =>
          m.generations
            .filter(
              (g) =>
                g.yearStart <= (info.modelYear as number) &&
                (g.yearEnd ?? 2100) >= (info.modelYear as number),
            )
            .map((g) => ({ model: m, generation: g })),
        )
      : [];

  return (
    <div>
      <div className="bg-carbon py-10 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-brass">vin</div>
          <div className="pt-4">
            <span className="plate plate-dark plate-lg">{info.vin}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        {info.error ? (
          <div className="panel border-r-[3px] border-r-alert bg-alert-soft p-4 text-sm">
            {info.error}
          </div>
        ) : null}

        {info.valid ? (
          <div className="panel mt-5 grid gap-px overflow-hidden bg-line sm:grid-cols-3">
            {[
              { label: "کد سازنده", value: info.wmi, mono: true },
              { label: "برند", value: make?.nameFa ?? "خارج از پوشش ما", mono: false },
              { label: "سال ساخت", value: info.modelYear ?? "نامشخص", mono: false },
            ].map((cell) => (
              <div key={cell.label} className="bg-surface p-5">
                <div className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-faint">
                  {cell.label}
                </div>
                <div
                  className={
                    cell.mono
                      ? "mono pt-2 text-lg font-bold"
                      : "tnum pt-2 font-display text-lg font-black"
                  }
                >
                  {String(cell.value)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {candidates.length > 0 ? (
          <section className="pt-10">
            <div className="rule pb-5">
              <h2 className="font-display text-base font-bold">خودروهای محتمل</h2>
              <span className="rule-label">select one</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map(({ model, generation }) => (
                <Link
                  key={generation.id}
                  href={`/catalog?generationId=${generation.id}`}
                  className="panel p-4 transition-colors hover:border-brass"
                >
                  <div className="font-display text-sm font-bold">
                    {make?.nameFa} {model.nameFa} {generation.nameFa}
                  </div>
                  <div className="tnum pt-1 text-xs text-faint">
                    {generation.yearStart}
                    {generation.yearEnd ? ` – ${generation.yearEnd}` : " به بعد"}
                  </div>
                </Link>
              ))}
            </div>
            <p className="pt-4 text-xs text-faint">
              تیپ و موتور دقیق با جدول دکد کامل سازنده مشخص می‌شود؛ فعلاً تا سطح مدل و سال.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
