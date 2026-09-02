import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPart } from "@/app/admin/catalog/actions";
import { Field, Area, Select, Actions } from "@/components/admin/Form";

export const dynamic = "force-dynamic";

/**
 * ثبت قطعه جدید.
 *
 * عمداً کوتاه است: فقط چیزهایی که بدون آن‌ها قطعه قابل انتشار نیست. بقیه —
 * سازگاری، کدهای معادل، قیمت و تصویر — بعد از ساخت، در صفحه همان قطعه.
 */
export default async function NewPartPage() {
  const [categories, brands] = await Promise.all([
    prisma.partCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
      include: { parent: true },
    }),
    prisma.partBrand.findMany({ where: { isActive: true }, orderBy: { nameFa: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/admin/parts" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به فهرست قطعات
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">قطعه جدید</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          آدرس صفحه از روی نام ساخته می‌شود و بعداً قابل تغییر است. با ثبت قطعه، یک پیشنهاد
          فروش پیش‌فرض هم ساخته می‌شود تا بتوانید موجودی و قیمتش را وارد کنید.
        </p>
      </header>

      <form action={createPart} className="panel flex flex-col gap-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="نام قطعه"
            name="nameFa"
            required
            placeholder="لنت ترمز جلو"
            hint="همان چیزی که مشتری جستجو می‌کند؛ بدون نام خودرو"
          />
          <Field
            label="شماره فنی اصلی"
            name="partNumber"
            dir="ltr"
            placeholder="58101-D3A00"
            hint="اگر الان دارید بنویسید؛ کدهای معادل را بعداً اضافه می‌کنید"
          />
          <Select
            label="دسته"
            name="categoryId"
            required
            placeholder="انتخاب کنید"
            options={categories.map((c) => ({
              value: c.id,
              label: c.parent ? `${c.parent.nameFa} ← ${c.nameFa}` : c.nameFa,
            }))}
          />
          <Select
            label="برند قطعه"
            name="brandId"
            placeholder="بدون برند"
            options={brands.map((b) => ({ value: b.id, label: b.nameFa }))}
          />
          <Field
            label="عنوان سئو"
            name="titleFa"
            placeholder="لنت ترمز جلو هیوندای توسان"
            hint="خالی بگذارید تا بعد از ثبت سازگاری، خودکار ساخته شود"
          />
          <Field label="نام انگلیسی" name="nameEn" dir="ltr" placeholder="Front Brake Pad" />
        </div>

        <Area
          label="توضیح کوتاه"
          name="description"
          rows={3}
          hint="اختیاری. متن سئوی بلند را بعداً از پنل سئوی محتوایی می‌سازید."
        />

        <Actions>
          <button type="submit" className="btn btn-brass px-8">
            ثبت قطعه
          </button>
          <Link href="/admin/parts" className="text-xs text-muted hover:text-ink">
            انصراف
          </Link>
        </Actions>
      </form>
    </div>
  );
}
