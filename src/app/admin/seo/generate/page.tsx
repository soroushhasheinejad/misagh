import Link from "next/link";
import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { summarize } from "@/lib/seo-inventory";
import { ENTITY_LABEL, SLOT_LABEL, type Slot } from "@/lib/seo-content";
import { faNumber } from "@/lib/format";
import { bulkGenerate, clearGenerated } from "../actions";

export const dynamic = "force-dynamic";

const TYPES: SeoEntity[] = ["PART", "CAR_MODEL", "CAR_CATEGORY", "CATEGORY"];

const MODES = [
  { key: "empty", label: "فقط صفحه‌های بدون محتوا", hint: "امن‌ترین حالت؛ هیچ متن موجودی دست نمی‌خورد" },
  {
    key: "generated",
    label: "به‌روزرسانی متن‌های ساخته‌شده با قالب",
    hint: "بعد از ویرایش قالب این را بزنید؛ متن‌های دستی دست‌نخورده می‌مانند",
  },
  { key: "all", label: "بازنویسی همه، حتی متن‌های دستی", hint: "متن‌هایی که خودتان نوشته‌اید پاک می‌شوند" },
];

export default async function GeneratePage() {
  const [summaries, templates] = await Promise.all([
    Promise.all(TYPES.map((t) => summarize(t))),
    prisma.contentTemplate.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به خلاصه سئو
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">تولید گروهی محتوا</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          قالب‌های فعال روی صفحه‌های انتخابی اجرا می‌شوند و برای هر صفحه متن یکتای خودش ساخته
          می‌شود. متنی که دستی نوشته‌اید، مگر اینکه حالت آخر را انتخاب کنید، دست نمی‌خورد.
        </p>
      </header>

      {templates.length === 0 ? (
        <div className="panel panel-brass p-5 text-sm leading-8 text-muted">
          هیچ قالب فعالی وجود ندارد. اول از{" "}
          <Link href="/admin/seo/templates" className="text-brass-dark link-brass">
            صفحه قالب‌ها
          </Link>{" "}
          قالب‌های پیش‌فرض را بسازید.
        </div>
      ) : null}

      {summaries.map((s) => {
        const slots = templates
          .filter((t) => t.entityType === s.entityType)
          .map((t) => SLOT_LABEL[t.slot as Slot] ?? t.slot);

        return (
          <section key={s.entityType} className="panel p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
              <h2 className="font-display text-base font-bold">
                {ENTITY_LABEL[s.entityType]}
              </h2>
              <span className="tnum text-xs text-muted">
                {faNumber(s.withContent)} از {faNumber(s.total)} صفحه محتوا دارد
              </span>
            </div>

            {slots.length === 0 ? (
              <p className="text-sm text-faint">برای این نوع صفحه قالب فعالی نیست.</p>
            ) : (
              <>
                <p className="pb-5 text-sm leading-7 text-muted">
                  قالب‌های فعال: {slots.join("، ")}
                </p>

                <form action={bulkGenerate} className="flex flex-col gap-4">
                  <input type="hidden" name="entityType" value={s.entityType} />

                  <div className="flex flex-col gap-3">
                    {MODES.map((mode, i) => (
                      <label key={mode.key} className="flex gap-3 text-sm">
                        <input
                          type="radio"
                          name="mode"
                          value={mode.key}
                          defaultChecked={i === 0}
                          className="mt-1.5 size-4 shrink-0"
                        />
                        <span>
                          {mode.label}
                          <span className="block pt-0.5 text-xs leading-6 text-faint">
                            {mode.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 text-sm">
                    <span className="text-muted">حداکثر تعداد در این اجرا</span>
                    <input
                      name="limit"
                      type="number"
                      min={1}
                      max={20000}
                      defaultValue={Math.min(6000, Math.max(s.total, 1))}
                      className="field tnum w-28 py-1.5 text-center"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <button type="submit" className="btn btn-brass px-6">
                      اجرا
                    </button>
                    <span className="text-xs text-faint">
                      برای {faNumber(s.total)} صفحه ممکن است چند ده ثانیه طول بکشد
                    </span>
                  </div>
                </form>

                <form action={clearGenerated} className="border-t border-line pt-4">
                  <input type="hidden" name="entityType" value={s.entityType} />
                  <button type="submit" className="text-xs text-muted hover:text-alert">
                    پاک کردن همه متن‌های ساخته‌شده با قالب این نوع صفحه
                  </button>
                </form>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
