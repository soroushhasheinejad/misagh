import { prisma } from "@/lib/prisma";
import { faNumber } from "@/lib/format";
import { Section, Field, Select, Toggle } from "@/components/admin/Form";
import { saveVinRule, deleteVinRule } from "../actions";

export const dynamic = "force-dynamic";

/**
 * قاعده‌های تشخیص خودرو از روی شماره شاسی.
 *
 * سه کاراکتر اول شماره شاسی (WMI) کارخانه سازنده را مشخص می‌کند و
 * کاراکترهای چهارم تا هشتم مدل و بدنه را. قاعده‌ای که اینجا ثبت شود روی
 * نگاشت داخلی کد اولویت دارد، پس با آمدن مدل تازه لازم نیست کد عوض شود.
 */
export default async function VinRulesPage() {
  const [rules, makes] = await Promise.all([
    prisma.vinRule.findMany({ include: { make: true }, orderBy: { wmi: "asc" } }),
    prisma.vehicleMake.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-xl font-black">قاعده‌های شماره شاسی</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          صفحه «تشخیص با شماره شاسی» اول این جدول را می‌خواند. اگر قاعده‌ای برای یک WMI ثبت
          نشده باشد، از نگاشت داخلی استفاده می‌شود و چیزی خراب نمی‌شود.
        </p>
      </header>

      <Section
        title={`قاعده‌ها (${faNumber(rules.length)})`}
        hint="الگو یک عبارت باقاعده است که روی کاراکترهای چهارم تا هشتم شماره شاسی اجرا می‌شود. خالی بگذارید تا قاعده برای همه شماره‌های آن WMI اعمال شود."
      >
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[620px]">
            <thead>
              <tr>
                <th className="w-20">WMI</th>
                <th className="w-28">برند</th>
                <th className="w-32">الگو</th>
                <th>مدل حدس‌زده‌شده</th>
                <th className="w-24">وضعیت</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted">
                    قاعده‌ای ثبت نشده است.
                  </td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td className="tnum font-medium" dir="ltr">
                      {r.wmi}
                    </td>
                    <td className="text-muted">{r.make.nameFa}</td>
                    <td className="text-xs text-muted" dir="ltr">
                      {r.pattern ?? "همه"}
                    </td>
                    <td className="text-muted">{r.modelHint ?? "—"}</td>
                    <td className="text-xs">
                      {r.isActive ? (
                        <span className="text-ok">فعال</span>
                      ) : (
                        <span className="text-faint">غیرفعال</span>
                      )}
                    </td>
                    <td>
                      <form action={deleteVinRule}>
                        <input type="hidden" name="id" value={r.id} />
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

        <form action={saveVinRule} className="panel mt-4 grid gap-4 p-5 sm:grid-cols-5">
          <Field label="WMI" name="wmi" dir="ltr" required placeholder="KMH" hint="سه کاراکتر اول" />
          <Select
            label="برند"
            name="makeId"
            required
            placeholder="انتخاب کنید"
            options={makes.map((m) => ({ value: m.id, label: m.nameFa }))}
          />
          <Field label="الگو" name="pattern" dir="ltr" placeholder="^J[0-9]" hint="اختیاری" />
          <Field label="مدل" name="modelHint" placeholder="توسان" />
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
