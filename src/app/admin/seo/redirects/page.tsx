import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { faNumber } from "@/lib/format";
import { Section, Field, Toggle } from "@/components/admin/Form";
import { saveRedirect, deleteRedirect, toggleRedirect } from "../actions";

export const dynamic = "force-dynamic";

/**
 * ریدایرکت ۳۰۸.
 *
 * هر بار آدرس یک قطعه یا خودرو عوض شود، ریدایرکتش خودکار ساخته می‌شود. اینجا
 * می‌شود دستی هم اضافه کرد — مثلاً برای آدرس‌هایی که از سایت قبلی مانده‌اند.
 * ستون «بازدید» نشان می‌دهد کدام ریدایرکت واقعاً استفاده می‌شود.
 */
export default async function RedirectsPage() {
  const rows = await prisma.redirect.findMany({
    orderBy: [{ hits: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  const used = rows.filter((r) => r.hits > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به خلاصه سئو
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">ریدایرکت‌ها</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          وقتی آدرسی عوض می‌شود، رتبه‌ای که گوگل به آدرس قدیمی داده بود فقط با ریدایرکت ۳۰۸
          به آدرس تازه منتقل می‌شود. تغییر آدرس قطعه و خودرو از پنل، خودش ریدایرکتش را
          می‌سازد؛ این صفحه برای موارد دستی است.
        </p>
        <p className="pt-2 text-xs text-faint">
          <span className="tnum">{faNumber(rows.length)}</span> ریدایرکت،{" "}
          <span className="tnum">{faNumber(used)}</span> تای آن‌ها دست‌کم یک بار استفاده شده.
        </p>
      </header>

      <Section title="ثبت ریدایرکت تازه">
        <form action={saveRedirect} className="panel grid gap-4 p-5 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <Field
              label="از این آدرس"
              name="source"
              dir="ltr"
              required
              placeholder="/part/old-slug"
              hint="فقط مسیر، بدون نام دامنه"
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="به این آدرس" name="destination" dir="ltr" required placeholder="/part/new-slug" />
          </div>
          <div className="flex items-end gap-3">
            <Toggle label="فعال" name="isActive" defaultChecked />
            <button type="submit" className="btn btn-brass mb-1 shrink-0 px-5 py-2 text-xs">
              ثبت
            </button>
          </div>
        </form>
      </Section>

      <Section title="فهرست">
        {rows.length === 0 ? (
          <div className="panel p-6 text-sm text-muted">هنوز ریدایرکتی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line bg-surface">
            <table className="spec min-w-[720px]">
              <thead>
                <tr>
                  <th>از</th>
                  <th>به</th>
                  <th className="w-20">بازدید</th>
                  <th className="w-24">وضعیت</th>
                  <th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-xs" dir="ltr">
                      {r.source}
                    </td>
                    <td className="text-xs text-muted" dir="ltr">
                      {r.destination}
                    </td>
                    <td className="tnum text-muted">{faNumber(r.hits)}</td>
                    <td className="text-xs">
                      {r.isActive ? (
                        <span className="text-ok">فعال</span>
                      ) : (
                        <span className="text-faint">خاموش</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-3 text-xs">
                        <form action={toggleRedirect}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="text-muted hover:text-brass-dark">
                            {r.isActive ? "خاموش" : "روشن"}
                          </button>
                        </form>
                        <form action={deleteRedirect}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="text-muted hover:text-alert">
                            حذف
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
