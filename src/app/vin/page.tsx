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
      <div className="mx-auto max-w-2xl px-4 py-10 text-muted">شماره شاسی را وارد کنید.</div>
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-lg font-bold">تشخیص خودرو از شماره شاسی</h1>
      <div className="pn pt-2 text-sm text-muted">{info.vin}</div>

      {!info.valid || info.error ? (
        <div className="mt-4 rounded border-r-4 border-signal bg-signal-soft p-4 text-sm">
          {info.error}
        </div>
      ) : null}

      {info.valid ? (
        <div className="mt-5 rounded-lg border border-line bg-surface p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted">کد سازنده</div>
              <div className="pn font-medium">{info.wmi}</div>
            </div>
            <div>
              <div className="text-xs text-muted">برند</div>
              <div className="font-medium">{make?.nameFa ?? "نامشخص"}</div>
            </div>
            <div>
              <div className="text-xs text-muted">سال ساخت</div>
              <div className="tnum font-medium">{info.modelYear ?? "نامشخص"}</div>
            </div>
          </div>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <section className="mt-6">
          <h2 className="pb-2 text-sm font-bold">خودروهای محتمل — یکی را انتخاب کنید</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {candidates.map(({ model, generation }) => (
              <Link
                key={generation.id}
                href={`/catalog?generationId=${generation.id}`}
                className="rounded-lg border border-line bg-surface p-3 text-sm hover:border-accent"
              >
                <div className="font-medium">
                  {make?.nameFa} {model.nameFa} {generation.nameFa}
                </div>
                <div className="tnum text-xs text-faint">
                  {generation.yearStart}
                  {generation.yearEnd ? `–${generation.yearEnd}` : " به بعد"}
                </div>
              </Link>
            ))}
          </div>
          <p className="pt-3 text-xs text-faint">
            رسیدن به تیپ و موتور دقیق نیاز به جدول دکد کامل سازنده دارد؛ فعلاً تا سطح مدل و سال تشخیص داده می‌شود.
          </p>
        </section>
      ) : null}
    </div>
  );
}
