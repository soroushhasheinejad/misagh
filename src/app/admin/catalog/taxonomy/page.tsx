import { prisma } from "@/lib/prisma";
import { faNumber } from "@/lib/format";
import { Section, Field, Select, Toggle } from "@/components/admin/Form";
import { saveCategory, deleteCategory, saveBrand, saveSupplier } from "../actions";

export const dynamic = "force-dynamic";

const TIERS = [
  { value: "GENUINE", label: "جنیون" },
  { value: "OEM_SUPPLIER", label: "سازنده اصلی" },
  { value: "HIGH_COPY", label: "های‌کپی" },
  { value: "AFTERMARKET", label: "متفرقه" },
  { value: "USED", label: "استوک" },
];

/**
 * دسته‌بندی، برند قطعه و تامین‌کننده — سه فهرست کوتاهی که کل کاتالوگ روی
 * آن‌ها سوار است. هر سه در یک صفحه‌اند چون کم‌تعدادند و معمولاً با هم
 * سر و کار پیدا می‌کنند.
 */
export default async function TaxonomyPage() {
  const [categories, brands, suppliers] = await Promise.all([
    prisma.partCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
      include: { parent: true, _count: { select: { parts: true } } },
    }),
    prisma.partBrand.findMany({
      orderBy: { nameFa: "asc" },
      include: { _count: { select: { parts: true, offers: true } } },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { offers: true } } },
    }),
  ]);

  const parentOptions = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ value: c.id, label: c.nameFa }));

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="font-display text-xl font-black">دسته، برند و تامین‌کننده</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          دسته‌بندی مستقیماً روی سئو اثر دارد: برای هر ترکیب «دسته × خودرو» یک صفحه هدفمند
          ساخته می‌شود. پس نام دسته را همان‌طور بنویسید که مشتری در گوگل می‌نویسد.
        </p>
      </header>

      {/* ---------------------------- دسته‌ها ---------------------------- */}
      <Section
        title={`دسته‌بندی قطعات (${faNumber(categories.length)})`}
        hint="دسته‌ای که قطعه دارد قابل حذف نیست؛ اول قطعه‌هایش را به دسته دیگری ببرید."
      >
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[620px]">
            <thead>
              <tr>
                <th>نام</th>
                <th className="w-40">زیرمجموعه</th>
                <th className="w-20">قطعه</th>
                <th className="w-20">ترتیب</th>
                <th className="w-24">وضعیت</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <form action={saveCategory} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="parentId" value={c.parentId ?? ""} />
                      <input
                        name="nameFa"
                        defaultValue={c.nameFa}
                        className="field py-1 text-xs"
                      />
                      <input type="hidden" name="sortOrder" value={c.sortOrder} />
                      <input type="hidden" name="isActive" value={c.isActive ? "on" : ""} />
                      <button type="submit" className="shrink-0 text-xs text-brass-dark">
                        ذخیره
                      </button>
                    </form>
                  </td>
                  <td className="text-muted">{c.parent?.nameFa ?? "—"}</td>
                  <td className="tnum text-muted">{faNumber(c._count.parts)}</td>
                  <td className="tnum text-muted">{faNumber(c.sortOrder)}</td>
                  <td className="text-xs">
                    {c.isActive ? (
                      <span className="text-ok">فعال</span>
                    ) : (
                      <span className="text-faint">غیرفعال</span>
                    )}
                  </td>
                  <td>
                    {c._count.parts === 0 ? (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
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

        <form action={saveCategory} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <Field label="نام دسته" name="nameFa" required placeholder="ترمز" />
          <Field label="نام انگلیسی" name="nameEn" dir="ltr" placeholder="Brakes" />
          <Select
            label="زیرمجموعه"
            name="parentId"
            placeholder="دسته اصلی"
            options={parentOptions}
          />
          <Field label="ترتیب" name="sortOrder" type="number" defaultValue={0} />
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* ---------------------------- برندها ---------------------------- */}
      <Section
        title={`برند قطعه (${faNumber(brands.length)})`}
        hint="سطح کیفیت روی صفحه محصول به مشتری نشان داده می‌شود و در متن سئو هم استفاده می‌شود."
      >
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[560px]">
            <thead>
              <tr>
                <th>نام</th>
                <th className="w-32">سطح کیفیت</th>
                <th className="w-28">کشور</th>
                <th className="w-24">پیشنهاد</th>
                <th className="w-24">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium">{b.nameFa}</td>
                  <td className="text-muted">
                    {TIERS.find((t) => t.value === b.qualityTier)?.label ?? b.qualityTier}
                  </td>
                  <td className="text-muted">{b.country ?? "—"}</td>
                  <td className="tnum text-muted">{faNumber(b._count.offers)}</td>
                  <td className="text-xs">
                    {b.isActive ? (
                      <span className="text-ok">فعال</span>
                    ) : (
                      <span className="text-faint">غیرفعال</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={saveBrand} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <Field label="نام برند" name="nameFa" required placeholder="موبیس" />
          <Field label="نام انگلیسی" name="nameEn" dir="ltr" />
          <Select label="سطح کیفیت" name="qualityTier" defaultValue="AFTERMARKET" options={TIERS} />
          <Field label="کشور" name="country" placeholder="کره جنوبی" />
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>

      {/* -------------------------- تامین‌کننده -------------------------- */}
      <Section
        title={`تامین‌کننده (${faNumber(suppliers.length)})`}
        hint="نام تامین‌کننده به مشتری نشان داده نمی‌شود مگر سوییچش در تنظیمات روشن باشد."
      >
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[560px]">
            <thead>
              <tr>
                <th>نام</th>
                <th className="w-36">تلفن</th>
                <th className="w-28">روز تحویل</th>
                <th className="w-24">پیشنهاد</th>
                <th className="w-24">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    تامین‌کننده‌ای ثبت نشده است.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td className="tnum text-muted" dir="ltr">
                      {s.phone ?? "—"}
                    </td>
                    <td className="tnum text-muted">{faNumber(s.defaultLeadDays)}</td>
                    <td className="tnum text-muted">{faNumber(s._count.offers)}</td>
                    <td className="text-xs">
                      {s.isActive ? (
                        <span className="text-ok">فعال</span>
                      ) : (
                        <span className="text-faint">غیرفعال</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form action={saveSupplier} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <Field label="نام" name="name" required />
          <Field label="تلفن" name="phone" dir="ltr" />
          <Field label="تلگرام" name="telegram" dir="ltr" placeholder="@username" />
          <Field label="روز تحویل پیش‌فرض" name="defaultLeadDays" type="number" defaultValue={0} />
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-ghost mb-1 shrink-0 px-4 py-2 text-xs">
              افزودن
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
