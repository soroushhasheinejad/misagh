import Link from "next/link";
import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ENTITY_LABEL, SLOT_LABEL, type Slot } from "@/lib/seo-content";
import { VAR_DOCS } from "@/lib/seo-vars";
import { saveTemplate, restoreDefaultTemplates } from "../actions";

export const dynamic = "force-dynamic";

const ORDER: SeoEntity[] = ["PART", "CAR_MODEL", "CAR_CATEGORY", "CATEGORY", "PAGE"];

export default async function TemplatesPage() {
  const templates = await prisma.contentTemplate.findMany({
    orderBy: [{ entityType: "asc" }, { slot: "asc" }],
  });

  const grouped = ORDER.map((type) => ({
    type,
    items: templates.filter((t) => t.entityType === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
            ← بازگشت به خلاصه سئو
          </Link>
          <h1 className="pt-3 font-display text-xl font-black">قالب‌های محتوا</h1>
          <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
            هر قالب یک بار نوشته می‌شود و برای هزاران صفحه پر می‌شود. جای‌گذارها با داده
            همان صفحه جایگزین می‌شوند، پس متن هر صفحه یکتاست و گوگل آن را تکراری نمی‌شمارد.
            بعد از ویرایش قالب، برای اعمالش به{" "}
            <Link href="/admin/seo/generate" className="text-brass-dark link-brass">
              تولید گروهی
            </Link>{" "}
            بروید.
          </p>
        </div>
        <form action={restoreDefaultTemplates}>
          <button type="submit" className="btn btn-ghost px-4 py-2 text-xs">
            بازگرداندن قالب‌های پیش‌فرض
          </button>
        </form>
      </header>

      {/* راهنمای شرط */}
      <div className="panel panel-brass p-5">
        <div className="font-display text-sm font-bold">شرط در قالب</div>
        <p className="pt-2 text-sm leading-8 text-muted">
          اگر بخشی از جمله فقط وقتی باید بیاید که داده‌ای وجود دارد، آن را داخل شرط بگذارید
          تا برای قطعه‌ای که آن داده را ندارد جمله ناقص نماند:
        </p>
        <code className="plate mt-3 inline-block text-xs" dir="ltr">
          {`{{#اگر شماره_فنی}}با کد {{شماره_فنی}}{{/اگر}}`}
        </code>
      </div>

      {grouped.length === 0 ? (
        <form action={restoreDefaultTemplates} className="panel p-6">
          <p className="pb-4 text-sm text-muted">هنوز قالبی ساخته نشده است.</p>
          <button type="submit" className="btn btn-brass">
            ساخت قالب‌های پیش‌فرض
          </button>
        </form>
      ) : null}

      {grouped.map((group) => (
        <section key={group.type}>
          <div className="flex items-center gap-2.5 pb-4">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">{ENTITY_LABEL[group.type]}</h2>
          </div>

          <div className="flex flex-wrap gap-2 pb-5">
            {VAR_DOCS[group.type].map((v) => (
              <span key={v.name} className="plate text-xs" title={v.hint}>
                {`{{${v.name}}}`}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {group.items.map((tpl) => (
              <form key={tpl.id} action={saveTemplate} className="panel p-5">
                <input type="hidden" name="id" value={tpl.id} />

                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-1">
                  <div>
                    <div className="font-display text-sm font-bold">{tpl.nameFa}</div>
                    <div className="pt-1 text-xs text-faint">
                      {SLOT_LABEL[tpl.slot as Slot] ?? tpl.slot}
                      {tpl.hintFa ? ` — ${tpl.hintFa}` : ""}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={tpl.isActive}
                      className="size-4"
                    />
                    فعال
                  </label>
                </div>

                <textarea
                  name="template"
                  defaultValue={tpl.template}
                  rows={tpl.slot === "body" ? 16 : 3}
                  className="field mt-3 w-full leading-8"
                  dir="rtl"
                />

                <button type="submit" className="btn btn-ghost mt-3 px-5 py-1.5 text-xs">
                  ذخیره قالب
                </button>
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
