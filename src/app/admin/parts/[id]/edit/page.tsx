import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { faYearRange, faNumber } from "@/lib/format";
import { Section, Field, Area, Select, Toggle, Actions } from "@/components/admin/Form";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  updatePart,
  deletePart,
  addPartNumber,
  deletePartNumber,
  addFitment,
  deleteFitment,
  createOffer,
  deleteOffer,
  setDefaultOffer,
  deletePartImage,
} from "@/app/admin/catalog/actions";

export const dynamic = "force-dynamic";

const POSITIONS: Array<{ value: string; label: string }> = [
  { value: "UNIVERSAL", label: "بدون محل خاص" },
  { value: "FRONT", label: "جلو" },
  { value: "REAR", label: "عقب" },
  { value: "LEFT", label: "چپ" },
  { value: "RIGHT", label: "راست" },
  { value: "FRONT_LEFT", label: "جلو چپ" },
  { value: "FRONT_RIGHT", label: "جلو راست" },
  { value: "REAR_LEFT", label: "عقب چپ" },
  { value: "REAR_RIGHT", label: "عقب راست" },
  { value: "UPPER", label: "بالا" },
  { value: "LOWER", label: "پایین" },
];

const NUMBER_TYPES = [
  { value: "OEM", label: "اصلی سازنده" },
  { value: "SUPERSEDED", label: "کد قدیمی" },
  { value: "AFTERMARKET", label: "بازار" },
  { value: "INTERNAL", label: "داخلی" },
];

export default async function EditPartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [part, categories, brands, suppliers, generations] = await Promise.all([
    prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        numbers: { orderBy: [{ isPrimary: "desc" }, { number: "asc" }], include: { brand: true } },
        images: { orderBy: { sortOrder: "asc" } },
        offers: { include: { brand: true, supplier: true }, orderBy: { sortOrder: "asc" } },
        fitments: {
          include: {
            generation: { include: { model: { include: { make: true } } } },
            trim: true,
          },
        },
      },
    }),
    prisma.partCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
      include: { parent: true },
    }),
    prisma.partBrand.findMany({ where: { isActive: true }, orderBy: { nameFa: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicleGeneration.findMany({
      where: { isActive: true },
      include: { model: { include: { make: true } } },
      orderBy: [{ yearStart: "asc" }],
    }),
  ]);

  if (!part) notFound();

  const generationOptions = generations.map((g) => ({
    value: g.id,
    label: `${g.model.make.nameFa} ${g.model.nameFa} ${g.nameFa} (${faYearRange(g.yearStart, g.yearEnd)})`,
  }));

  return (
    <div className="flex flex-col gap-10">
      <header>
        <Link href="/admin/parts" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به فهرست قطعات
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">{part.nameFa}</h1>

        <nav className="flex flex-wrap gap-2 pt-4">
          <span className="rounded-md border border-brass bg-brass/10 px-3 py-1.5 text-xs font-bold text-brass-dark">
            مشخصات و کاتالوگ
          </span>
          <Link
            href={`/admin/parts/${id}`}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-brass"
          >
            قیمت و موجودی
          </Link>
          <Link
            href={`/admin/seo/edit?type=PART&key=${id}`}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-brass"
          >
            محتوای سئو
          </Link>
          <Link
            href={`/part/${encodeURIComponent(part.slug)}`}
            target="_blank"
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-brass"
          >
            دیدن صفحه ↗
          </Link>
        </nav>
      </header>

      {/* ------------------------- مشخصات ------------------------- */}
      <Section title="مشخصات قطعه">
        <form action={updatePart} className="panel flex flex-col gap-6 p-6">
          <input type="hidden" name="id" value={part.id} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="نام قطعه" name="nameFa" defaultValue={part.nameFa} required />
            <Field
              label="عنوان سئو"
              name="titleFa"
              defaultValue={part.titleFa}
              hint="نام قطعه به‌همراه برند و مدل خودرو"
            />
            <Field
              label="آدرس صفحه"
              name="slug"
              defaultValue={part.slug}
              hint="اگر عوض کنید، از آدرس قبلی خودکار ریدایرکت ۳۰۸ ساخته می‌شود"
            />
            <Field label="نام انگلیسی" name="nameEn" defaultValue={part.nameEn} dir="ltr" />
            <Select
              label="دسته"
              name="categoryId"
              defaultValue={part.categoryId}
              required
              options={categories.map((c) => ({
                value: c.id,
                label: c.parent ? `${c.parent.nameFa} ← ${c.nameFa}` : c.nameFa,
              }))}
            />
            <Select
              label="برند قطعه"
              name="brandId"
              defaultValue={part.brandId}
              placeholder="بدون برند"
              options={brands.map((b) => ({ value: b.id, label: b.nameFa }))}
            />
          </div>

          <Area label="توضیح کوتاه" name="description" defaultValue={part.description} rows={3} />

          <div className="grid gap-5 sm:grid-cols-4">
            <Field label="وزن (گرم)" name="weightGram" type="number" defaultValue={part.weightGram} />
            <Field label="طول (م‌م)" name="lengthMm" type="number" defaultValue={part.lengthMm} />
            <Field label="عرض (م‌م)" name="widthMm" type="number" defaultValue={part.widthMm} />
            <Field label="ارتفاع (م‌م)" name="heightMm" type="number" defaultValue={part.heightMm} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="حداقل سفارش"
              name="minOrderQty"
              type="number"
              defaultValue={part.minOrderQty}
            />
            <Toggle label="فعال و قابل نمایش در سایت" name="isActive" defaultChecked={part.isActive} />
            <Toggle label="نمایش در قطعات منتخب" name="isFeatured" defaultChecked={part.isFeatured} />
          </div>

          <Actions>
            <button type="submit" className="btn btn-brass px-8">
              ذخیره مشخصات
            </button>
          </Actions>
        </form>
      </Section>

      {/* ------------------------- شماره فنی ------------------------- */}
      <Section
        title="شماره‌های فنی"
        hint="کد اصلی، کد قدیمی و کدهای بازار. جستجوی هر کدام مشتری را به همین قطعه می‌رساند و برای هر کد یک صفحه اختصاصی ساخته می‌شود."
      >
        <div className="overflow-hidden rounded-md border border-line bg-surface">
          <table className="spec">
            <thead>
              <tr>
                <th>شماره</th>
                <th>نوع</th>
                <th>برند</th>
                <th className="w-20">اصلی</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {part.numbers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    هنوز شماره فنی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                part.numbers.map((n) => (
                  <tr key={n.id}>
                    <td className="tnum font-medium" dir="ltr">
                      {n.number}
                    </td>
                    <td className="text-muted">
                      {NUMBER_TYPES.find((t) => t.value === n.type)?.label ?? n.type}
                    </td>
                    <td className="text-muted">{n.brand?.nameFa ?? "—"}</td>
                    <td>{n.isPrimary ? <span className="text-ok">بله</span> : "—"}</td>
                    <td>
                      <form action={deletePartNumber}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="partId" value={part.id} />
                        <button type="submit" className="text-xs text-muted hover:text-alert">
                          حذف
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form action={addPartNumber} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <input type="hidden" name="partId" value={part.id} />
          <Field label="شماره" name="number" dir="ltr" required placeholder="58101-D3A00" />
          <Select label="نوع" name="type" defaultValue="OEM" options={NUMBER_TYPES} />
          <Select
            label="برند"
            name="brandId"
            placeholder="بدون برند"
            options={brands.map((b) => ({ value: b.id, label: b.nameFa }))}
          />
          <div className="flex items-end">
            <Toggle label="کد اصلی" name="isPrimary" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-ghost w-full py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* ------------------------- سازگاری ------------------------- */}
      <Section
        title="خودروهای سازگار"
        hint="هر ردیف، صفحه این قطعه را به صفحه آن خودرو وصل می‌کند و در ساخت عنوان سئو هم استفاده می‌شود."
      >
        <div className="overflow-hidden rounded-md border border-line bg-surface">
          <table className="spec">
            <thead>
              <tr>
                <th>خودرو</th>
                <th className="w-32">سال</th>
                <th className="w-28">محل نصب</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {part.fitments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    سازگاری ثبت نشده — این قطعه در صفحه هیچ خودرویی دیده نمی‌شود.
                  </td>
                </tr>
              ) : (
                part.fitments.map((f) => (
                  <tr key={f.id}>
                    <td className="font-medium">
                      {f.generation
                        ? `${f.generation.model.make.nameFa} ${f.generation.model.nameFa} ${f.generation.nameFa}`
                        : "—"}
                      {f.trim ? <span className="pr-2 text-xs text-faint">{f.trim.nameFa}</span> : null}
                    </td>
                    <td className="tnum text-muted">
                      {f.generation
                        ? faYearRange(
                            f.yearFrom ?? f.generation.yearStart,
                            f.yearTo ?? f.generation.yearEnd,
                          )
                        : "—"}
                    </td>
                    <td className="text-muted">
                      {POSITIONS.find((p) => p.value === f.position)?.label ?? f.position}
                    </td>
                    <td>
                      <form action={deleteFitment}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="partId" value={part.id} />
                        <button type="submit" className="text-xs text-muted hover:text-alert">
                          حذف
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form action={addFitment} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <input type="hidden" name="partId" value={part.id} />
          <div className="sm:col-span-2">
            <Select
              label="نسل خودرو"
              name="generationId"
              required
              placeholder="انتخاب کنید"
              options={generationOptions}
            />
          </div>
          <Select label="محل نصب" name="position" defaultValue="UNIVERSAL" options={POSITIONS} />
          <Field label="از سال" name="yearFrom" type="number" hint="خالی = از ابتدای نسل" />
          <div className="flex items-end gap-3">
            <Field label="تا سال" name="yearTo" type="number" />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* ------------------------- پیشنهادها ------------------------- */}
      <Section
        title="پیشنهادهای فروش"
        hint="هر پیشنهاد یک ترکیب برند و تامین‌کننده است. قیمت و موجودی هر کدام در بخش «قیمت و موجودی» تنظیم می‌شود."
      >
        <div className="overflow-hidden rounded-md border border-line bg-surface">
          <table className="spec">
            <thead>
              <tr>
                <th>برند</th>
                <th>تامین‌کننده</th>
                <th className="w-24">موجودی</th>
                <th className="w-24">تحویل</th>
                <th className="w-24">پیش‌فرض</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {part.offers.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.brand?.nameFa ?? "—"}</td>
                  <td className="text-muted">{o.supplier?.name ?? "—"}</td>
                  <td className="tnum text-muted">{faNumber(o.stockQty)}</td>
                  <td className="tnum text-muted">{faNumber(o.leadTimeDays)} روز</td>
                  <td>
                    {o.isDefault ? (
                      <span className="text-ok">پیش‌فرض</span>
                    ) : (
                      <form action={setDefaultOffer}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="partId" value={part.id} />
                        <button type="submit" className="text-xs text-muted hover:text-brass-dark">
                          انتخاب
                        </button>
                      </form>
                    )}
                  </td>
                  <td>
                    {part.offers.length > 1 ? (
                      <form action={deleteOffer}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="partId" value={part.id} />
                        <button type="submit" className="text-xs text-muted hover:text-alert">
                          حذف
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createOffer} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <input type="hidden" name="partId" value={part.id} />
          <Select
            label="برند"
            name="brandId"
            placeholder="بدون برند"
            options={brands.map((b) => ({ value: b.id, label: b.nameFa }))}
          />
          <Select
            label="تامین‌کننده"
            name="supplierId"
            placeholder="بدون تامین‌کننده"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Field label="موجودی" name="stockQty" type="number" defaultValue={0} />
          <Field label="روز تا تحویل" name="leadTimeDays" type="number" defaultValue={0} />
          <div className="flex items-end">
            <button type="submit" className="btn btn-ghost w-full py-2 text-xs">
              افزودن پیشنهاد
            </button>
          </div>
        </form>
      </Section>

      {/* ------------------------- تصاویر ------------------------- */}
      <Section
        title="تصاویر"
        hint="اولین تصویر در کارت محصول و نتایج جستجو دیده می‌شود. حداکثر ۵ مگابایت، فرمت JPG، PNG، WebP یا AVIF."
      >
        {part.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-4">
            {part.images.map((img) => (
              <div key={img.id} className="panel overflow-hidden p-0">
                {/* تصویر آپلودی است، نه از منبع خارجی؛ img ساده کافی است */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt ?? part.nameFa}
                  className="aspect-square w-full object-cover"
                />
                <form action={deletePartImage} className="p-2 text-center">
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="partId" value={part.id} />
                  <button type="submit" className="text-xs text-muted hover:text-alert">
                    حذف تصویر
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="pb-4 text-sm text-muted">
            هنوز تصویری ندارد. صفحه محصول بدون تصویر، نرخ تبدیل پایین‌تری دارد.
          </p>
        )}

        <ImageUploader partId={part.id} />
      </Section>

      {/* ------------------------- حذف ------------------------- */}
      <section className="border-t border-line pt-6">
        <form action={deletePart}>
          <input type="hidden" name="id" value={part.id} />
          <button type="submit" className="text-xs text-muted hover:text-alert">
            حذف کامل این قطعه و همه داده‌هایش
          </button>
        </form>
      </section>
    </div>
  );
}
