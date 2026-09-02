import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { faNumber, faYear, faYearRange } from "@/lib/format";
import { Section, Field, Select, Toggle } from "@/components/admin/Form";
import { saveMake, saveModel, saveGeneration, saveTrim } from "../actions";

export const dynamic = "force-dynamic";

const FUELS = [
  { value: "PETROL", label: "بنزینی" },
  { value: "DIESEL", label: "دیزلی" },
  { value: "HYBRID", label: "هیبرید" },
  { value: "ELECTRIC", label: "برقی" },
  { value: "LPG", label: "گازسوز" },
];

/**
 * درخت خودرو: برند ← مدل ← نسل ← تیپ.
 *
 * سازگاری قطعه به «نسل» بسته می‌شود، پس نسل واحد اصلی است. هر مدل هم یک
 * صفحه فرود سئو دارد («لوازم یدکی توسان»)، پس اضافه کردن مدل تازه یعنی
 * ساخته شدن یک صفحه هدفمند تازه.
 */
export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const { model: selectedModelId } = await searchParams;

  const [makes, models, selected] = await Promise.all([
    prisma.vehicleMake.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.vehicleModel.findMany({
      orderBy: [{ makeId: "asc" }, { nameFa: "asc" }],
      include: {
        make: true,
        _count: { select: { generations: true, fitments: true } },
      },
    }),
    selectedModelId
      ? prisma.vehicleModel.findUnique({
          where: { id: selectedModelId },
          include: {
            make: true,
            generations: {
              orderBy: { yearStart: "asc" },
              include: {
                trims: { orderBy: { nameFa: "asc" } },
                _count: { select: { fitments: true } },
              },
            },
          },
        })
      : null,
  ]);

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="font-display text-xl font-black">خودروها</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          سازگاری هر قطعه به «نسل» وصل می‌شود، نه به مدل. برای هر مدل یک صفحه فرود سئو ساخته
          می‌شود، پس نام مدل را همان‌طور بنویسید که مشتری جستجو می‌کند — «توسان» نه
          «Tucson».
        </p>
      </header>

      {/* ---------------------------- برندها ---------------------------- */}
      <Section title="برند خودرو">
        <div className="flex flex-wrap gap-3">
          {makes.map((m) => (
            <div key={m.id} className="panel px-4 py-2.5 text-sm">
              <span className="font-display font-bold">{m.nameFa}</span>
              <span className="pr-2 text-xs text-faint" dir="ltr">
                {m.slug}
              </span>
            </div>
          ))}
        </div>

        <form action={saveMake} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-4">
          <Field label="نام فارسی" name="nameFa" required placeholder="هیوندای" />
          <Field label="نام انگلیسی" name="nameEn" dir="ltr" required placeholder="Hyundai" />
          <Field label="ترتیب" name="sortOrder" type="number" defaultValue={0} />
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* ---------------------------- مدل‌ها ---------------------------- */}
      <Section
        title={`مدل خودرو (${faNumber(models.length)})`}
        hint="روی هر مدل بزنید تا نسل‌ها و تیپ‌هایش را ببینید و ویرایش کنید."
      >
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[620px]">
            <thead>
              <tr>
                <th>مدل</th>
                <th className="w-28">برند</th>
                <th className="w-32">آدرس</th>
                <th className="w-20">نسل</th>
                <th className="w-24">سازگاری</th>
                <th className="w-28" />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className={m.id === selectedModelId ? "bg-brass/5" : undefined}>
                  <td className="font-medium">{m.nameFa}</td>
                  <td className="text-muted">{m.make.nameFa}</td>
                  <td className="text-xs text-faint" dir="ltr">
                    {m.slug}
                  </td>
                  <td className="tnum text-muted">{faNumber(m._count.generations)}</td>
                  <td className="tnum text-muted">{faNumber(m._count.fitments)}</td>
                  <td>
                    <div className="flex gap-3 text-xs">
                      <Link
                        href={`/admin/catalog/vehicles?model=${m.id}`}
                        className="font-bold text-brass-dark hover:underline"
                      >
                        نسل‌ها
                      </Link>
                      <Link
                        href={`/car/${m.make.slug}/${m.slug}`}
                        target="_blank"
                        className="text-muted hover:text-ink"
                      >
                        صفحه ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={saveModel} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <Select
            label="برند"
            name="makeId"
            required
            placeholder="انتخاب کنید"
            options={makes.map((m) => ({ value: m.id, label: m.nameFa }))}
          />
          <Field label="نام فارسی" name="nameFa" required placeholder="توسان" />
          <Field label="نام انگلیسی" name="nameEn" dir="ltr" placeholder="Tucson" />
          <Field label="آدرس" name="slug" dir="ltr" hint="خالی = از نام انگلیسی" />
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* ------------------------ نسل‌ها و تیپ‌ها ------------------------ */}
      {selected ? (
        <>
          <Section
            title={`نسل‌های ${selected.make.nameFa} ${selected.nameFa}`}
            hint="سال پایان را خالی بگذارید اگر خودرو هنوز تولید می‌شود."
            action={
              <Link
                href="/admin/catalog/vehicles"
                className="text-xs text-muted hover:text-brass-dark"
              >
                بستن
              </Link>
            }
          >
            <div className="overflow-x-auto rounded-md border border-line bg-surface">
              <table className="spec min-w-[560px]">
                <thead>
                  <tr>
                    <th>نسل</th>
                    <th className="w-24">کد</th>
                    <th className="w-36">سال</th>
                    <th className="w-24">سازگاری</th>
                    <th className="w-24">تیپ</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.generations.map((g) => (
                    <tr key={g.id}>
                      <td className="font-medium">{g.nameFa}</td>
                      <td className="text-muted" dir="ltr">
                        {g.code ?? "—"}
                      </td>
                      <td className="tnum text-muted">{faYearRange(g.yearStart, g.yearEnd)}</td>
                      <td className="tnum text-muted">{faNumber(g._count.fitments)}</td>
                      <td className="tnum text-muted">{faNumber(g.trims.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form action={saveGeneration} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
              <input type="hidden" name="modelId" value={selected.id} />
              <Field label="نام نسل" name="nameFa" required placeholder="نسل سوم" />
              <Field label="کد سازنده" name="code" dir="ltr" placeholder="TL" />
              <Field label="از سال" name="yearStart" type="number" required placeholder="2015" />
              <Field label="تا سال" name="yearEnd" type="number" hint="خالی = هنوز تولید می‌شود" />
              <div className="flex items-end gap-3">
                <Toggle label="فعال" name="isActive" defaultChecked />
                <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
                  افزودن
                </button>
              </div>
            </form>
          </Section>

          <Section
            title="تیپ و موتور"
            hint="اختیاری. وقتی لازم است که قطعه بین تیپ‌های یک نسل فرق کند."
          >
            {selected.generations.some((g) => g.trims.length > 0) ? (
              <div className="flex flex-wrap gap-2 pb-4">
                {selected.generations.flatMap((g) =>
                  g.trims.map((t) => (
                    <span key={t.id} className="panel px-3 py-1.5 text-xs">
                      {g.nameFa} — {t.nameFa}
                      {t.engineCode ? (
                        <span className="pr-2 text-faint" dir="ltr">
                          {t.engineCode}
                        </span>
                      ) : null}
                    </span>
                  )),
                )}
              </div>
            ) : null}

            <form action={saveTrim} className="panel grid gap-4 p-5 sm:grid-cols-5">
              <Select
                label="نسل"
                name="generationId"
                required
                placeholder="انتخاب کنید"
                options={selected.generations.map((g) => ({
                  value: g.id,
                  label: `${g.nameFa} (${faYear(g.yearStart)})`,
                }))}
              />
              <Field label="نام تیپ" name="nameFa" required placeholder="۲.۰ بنزینی" />
              <Field label="کد موتور" name="engineCode" dir="ltr" placeholder="G4NA" />
              <Select label="سوخت" name="fuel" defaultValue="PETROL" options={FUELS} />
              <div className="flex items-end gap-3">
                <Toggle label="فعال" name="isActive" defaultChecked />
                <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
                  افزودن
                </button>
              </div>
            </form>
          </Section>
        </>
      ) : null}
    </div>
  );
}
