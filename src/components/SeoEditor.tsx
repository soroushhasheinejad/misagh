"use client";

import { useState } from "react";
import { SLOT_LIMITS, SLOT_LABEL, type Slot } from "@/lib/seo-content";
import { faNumber } from "@/lib/format";

/**
 * ویرایشگر محتوای سئوی یک صفحه.
 *
 * سه چیزی که کار را واقعاً جلو می‌برد اینجاست:
 *   ۱. شمارنده زنده طول، با آستانه‌ای که گوگل عملاً اعمال می‌کند
 *   ۲. پیش‌نمایش نتیجه گوگل، تا قبل از انتشار ببینید چه شکلی می‌شود
 *   ۳. دکمه «پر کردن از قالب» برای هر جایگاه، جدا از بقیه
 */

const FIELDS: Array<{ slot: Slot; rows: number; hint: string }> = [
  {
    slot: "metaTitle",
    rows: 2,
    hint: "کلیدواژه اصلی را اول جمله بگذارید؛ گوگل به ابتدای عنوان وزن بیشتری می‌دهد.",
  },
  {
    slot: "metaDescription",
    rows: 3,
    hint: "اینجا رتبه ساخته نمی‌شود، ولی نرخ کلیک ساخته می‌شود. یک دلیل خرید بنویسید.",
  },
  { slot: "h1", rows: 2, hint: "اگر خالی بماند، تیتر پیش‌فرض صفحه استفاده می‌شود." },
  { slot: "intro", rows: 4, hint: "پاراگراف بالای صفحه، بالای جدول‌ها." },
  {
    slot: "body",
    rows: 18,
    hint: "متن بلند پایین صفحه. مارک‌داون پشتیبانی می‌شود: ## تیتر، - فهرست، **پررنگ**، [متن](لینک).",
  },
];

function Counter({ slot, value }: { slot: Slot; value: string }) {
  const len = value.trim().length;
  const { min, max } = SLOT_LIMITS[slot];
  const words = value.trim() ? value.trim().split(/[\s‌]+/).length : 0;

  const tone = len === 0 ? "text-faint" : len > max ? "text-alert" : len < min ? "text-brass-dark" : "text-ok";

  return (
    <span className={`tnum text-xs ${tone}`}>
      {slot === "body" ? (
        <>
          {faNumber(words)} کلمه
          {words < 200 ? " — کمتر از حد رقابتی" : ""}
        </>
      ) : (
        <>
          {faNumber(len)} / {faNumber(max)}
          {len > max ? " — بریده می‌شود" : ""}
        </>
      )}
    </span>
  );
}

export function SeoEditor({
  entityType,
  entityKey,
  label,
  path,
  initial,
  fromTemplate,
  noindex,
  vars,
  returnTo,
  onSave,
  onReset,
  hasRecord,
  targetKeyword,
  faq,
  ogImage,
}: {
  entityType: string;
  entityKey: string;
  label: string;
  path: string;
  initial: Partial<Record<Slot, string>>;
  fromTemplate: Partial<Record<Slot, string>>;
  noindex: boolean;
  vars: Array<{ name: string; hint: string }>;
  returnTo: string;
  onSave: (formData: FormData) => void;
  onReset: (formData: FormData) => void;
  hasRecord: boolean;
  targetKeyword?: string | null;
  /** هر خط: پرسش || پاسخ */
  faq?: string;
  ogImage?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const f of FIELDS) start[f.slot] = initial[f.slot] ?? "";
    return start;
  });

  const set = (slot: Slot, value: string) =>
    setValues((prev) => ({ ...prev, [slot]: value }));

  const fillAll = () => {
    setValues((prev) => {
      const next = { ...prev };
      for (const f of FIELDS) {
        const tpl = fromTemplate[f.slot];
        if (tpl) next[f.slot] = tpl;
      }
      return next;
    });
  };

  const title = values.metaTitle || label;
  const desc = values.metaDescription || "توضیح متا نوشته نشده است.";

  return (
    <div className="flex flex-col gap-8">
      {/* پیش‌نمایش نتیجه گوگل */}
      <section>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">در نتایج گوگل این‌طور دیده می‌شود</h2>
          </div>
          {Object.keys(fromTemplate).length > 0 ? (
            <button type="button" onClick={fillAll} className="btn btn-ghost px-4 py-1.5 text-xs">
              پر کردن همه از قالب
            </button>
          ) : null}
        </div>

        <div className="panel p-5" dir="rtl">
          <div className="truncate text-xs text-muted" dir="ltr">
            {path}
          </div>
          <div className="pt-1 font-display text-base font-bold text-[#1a0dab] dark:text-[#8ab4f8]">
            {title.length > 60 ? `${title.slice(0, 60)}…` : title}
          </div>
          <div className="pt-1 text-sm leading-7 text-muted">
            {desc.length > 158 ? `${desc.slice(0, 158)}…` : desc}
          </div>
        </div>
      </section>

      <form action={onSave} className="flex flex-col gap-7">
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityKey" value={entityKey} />
        <input type="hidden" name="returnTo" value={returnTo} />

        {FIELDS.map((field) => {
          const tpl = fromTemplate[field.slot];
          return (
            <div key={field.slot}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
                <label className="font-display text-sm font-bold" htmlFor={field.slot}>
                  {SLOT_LABEL[field.slot]}
                </label>
                <div className="flex items-center gap-3">
                  <Counter slot={field.slot} value={values[field.slot]} />
                  {tpl ? (
                    <button
                      type="button"
                      onClick={() => set(field.slot, tpl)}
                      className="text-xs text-muted hover:text-brass-dark"
                    >
                      از قالب
                    </button>
                  ) : null}
                </div>
              </div>

              <textarea
                id={field.slot}
                name={field.slot}
                rows={field.rows}
                value={values[field.slot]}
                onChange={(e) => set(field.slot, e.target.value)}
                className="field w-full leading-8"
              />
              <p className="pt-1.5 text-xs leading-6 text-faint">{field.hint}</p>
            </div>
          );
        })}

        {/* کلیدواژه هدف — مبنای امتیازدهی و گزارش «کلیدواژه غایب در عنوان» */}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-display text-sm font-bold">کلیدواژه هدف</span>
            <input
              name="targetKeyword"
              defaultValue={targetKeyword ?? ""}
              placeholder="لنت ترمز جلو توسان"
              className="field mt-2"
            />
            <span className="block pt-1.5 text-xs leading-6 text-faint">
              دقیقاً همان عبارتی که می‌خواهید با آن پیدا شوید. اگر در عنوان نباشد، در
              گزارش‌ها هشدار می‌گیرید.
            </span>
          </label>

          <label className="block text-sm">
            <span className="font-display text-sm font-bold">تصویر اشتراک‌گذاری</span>
            <input
              name="ogImage"
              defaultValue={ogImage ?? ""}
              dir="ltr"
              placeholder="/uploads/…"
              className="field mt-2"
            />
            <span className="block pt-1.5 text-xs leading-6 text-faint">
              خالی بگذارید تا تصویر پیش‌فرض سایت استفاده شود.
            </span>
          </label>
        </div>

        {/* پرسش و پاسخ — به اسکیمای FAQPage تبدیل می‌شود */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
            <label htmlFor="faq" className="font-display text-sm font-bold">
              پرسش‌های متداول این صفحه
            </label>
            <span className="text-xs text-faint">هر خط: پرسش || پاسخ</span>
          </div>
          <textarea
            id="faq"
            name="faq"
            rows={6}
            defaultValue={faq ?? ""}
            placeholder="این قطعه روی توسان ۲۰۱۸ می‌خورد؟ || بله، برای نسل TL از سال ۲۰۱۵ تا ۲۰۲۰ سازگار است."
            className="field w-full leading-8"
          />
          <p className="pt-1.5 text-xs leading-6 text-faint">
            این پرسش‌ها هم روی صفحه دیده می‌شوند و هم به گوگل به‌صورت داده ساختاریافته
            معرفی می‌شوند، پس نتیجه شما در صفحه جستجو فضای بیشتری می‌گیرد.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="noindex" defaultChecked={noindex} className="size-4" />
          <span>
            این صفحه در گوگل ایندکس نشود
            <span className="pr-2 text-xs text-faint">
              برای صفحه‌های کم‌ارزش که فقط بودجه خزش را می‌خورند
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button type="submit" className="btn btn-brass px-8">
            ذخیره
          </button>
          <a href={path} target="_blank" rel="noreferrer" className="btn btn-ghost px-5">
            دیدن صفحه ↗
          </a>
        </div>
      </form>

      {hasRecord ? (
        <form action={onReset} className="border-t border-line pt-5">
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityKey" value={entityKey} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className="text-xs text-muted hover:text-alert">
            پاک کردن محتوای این صفحه و بازگشت به قالب
          </button>
        </form>
      ) : null}

      {/* راهنمای جای‌گذارها */}
      <section className="border-t border-line pt-6">
        <div className="flex items-center gap-2.5 pb-3">
          <span className="size-[7px] rotate-45 bg-brass" />
          <h2 className="font-display text-sm font-bold">
            متغیرهایی که در قالب این نوع صفحه کار می‌کنند
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {vars.map((v) => (
            <span key={v.name} className="plate text-xs" title={v.hint}>
              {`{{${v.name}}}`}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
