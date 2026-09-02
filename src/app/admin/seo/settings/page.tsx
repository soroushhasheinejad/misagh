import Link from "next/link";
import { getSettings, DEFAULT_SETTINGS, type SettingKey } from "@/lib/settings";
import { saveSettings } from "@/app/admin/actions";
import { Section, Actions } from "@/components/admin/Form";

export const dynamic = "force-dynamic";

/**
 * تنظیمات سئوی کل سایت.
 *
 * چیزهایی که به یک صفحه مشخص وصل نیستند: عنوان پیش‌فرض، الگوی عنوان، کد تایید
 * سرچ کنسول، اسکیماها و اینکه کدام خانواده صفحه در نقشه سایت بیاید.
 *
 * فرم همان اکشن تنظیمات فروشگاه را صدا می‌زند، پس همه کلیدها — حتی آن‌هایی که
 * در این صفحه نیستند — باید فرستاده شوند وگرنه به مقدار پیش‌فرض برمی‌گردند.
 */

const TEXT_FIELDS: Array<{ key: SettingKey; label: string; hint?: string; rows?: number }> = [
  { key: "seo.siteName", label: "نام سایت", hint: "در اسکیمای کسب‌وکار و اشتراک‌گذاری استفاده می‌شود" },
  { key: "seo.titleDefault", label: "عنوان صفحه اصلی" },
  {
    key: "seo.titleTemplate",
    label: "الگوی عنوان بقیه صفحه‌ها",
    hint: "%s جای عنوان خود صفحه می‌نشیند. مثال: %s | میثاق یدک",
  },
  { key: "seo.defaultDescription", label: "توضیح متای پیش‌فرض", rows: 3 },
  {
    key: "seo.defaultOgImage",
    label: "تصویر اشتراک‌گذاری پیش‌فرض",
    hint: "آدرس تصویری که هنگام اشتراک لینک در تلگرام و واتساپ دیده می‌شود",
  },
  {
    key: "seo.googleVerification",
    label: "کد تایید گوگل سرچ کنسول",
    hint: "فقط مقدار content تگ تایید، نه کل تگ",
  },
];

const SCHEMA_TOGGLES: Array<{ key: SettingKey; label: string; hint: string }> = [
  {
    key: "seo.productSchemaEnabled",
    label: "اسکیمای محصول",
    hint: "صفحه قطعه را به گوگل به‌عنوان محصول معرفی می‌کند — رقیب این را ندارد",
  },
  {
    key: "seo.breadcrumbSchemaEnabled",
    label: "اسکیمای مسیر راهنما",
    hint: "به‌جای آدرس خام، مسیر دسته‌بندی در نتایج نشان داده می‌شود",
  },
  {
    key: "seo.faqSchemaEnabled",
    label: "اسکیمای پرسش و پاسخ",
    hint: "پرسش‌های هر صفحه زیر نتیجه گوگل باز می‌شوند و فضای بیشتری می‌گیرند",
  },
  {
    key: "seo.organizationSchemaEnabled",
    label: "اسکیمای کسب‌وکار",
    hint: "نام و تلفن فروشگاه را به گوگل معرفی می‌کند",
  },
];

const SITEMAP_TOGGLES: Array<{ key: SettingKey; label: string; hint: string }> = [
  { key: "seo.sitemapParts", label: "صفحه‌های قطعه", hint: "بیشترین حجم نقشه سایت" },
  { key: "seo.sitemapOem", label: "صفحه‌های شماره فنی", hint: "کم‌رقابت‌ترین مسیر ورود" },
  { key: "seo.sitemapCars", label: "صفحه‌های خودرو و دسته×خودرو", hint: "پرجستجوترین عبارت‌ها" },
  { key: "seo.sitemapPosts", label: "مقاله‌های بلاگ", hint: "" },
];

export default async function SeoSettingsPage() {
  const settings = await getSettings();

  // کلیدهایی که در این فرم فیلد دارند
  const shown = new Set<string>([
    ...TEXT_FIELDS.map((f) => f.key),
    ...SCHEMA_TOGGLES.map((t) => t.key),
    ...SITEMAP_TOGGLES.map((t) => t.key),
    "seo.autoNoindexThin",
    "seo.thinWordThreshold",
  ]);

  const hidden = (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).filter((k) => !shown.has(k));

  return (
    <div className="flex flex-col gap-10">
      <header>
        <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به خلاصه سئو
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">تنظیمات سئو</h1>
        <p className="max-w-[68ch] pt-2 text-sm leading-8 text-muted">
          این‌ها روی کل سایت اثر می‌گذارند. تنظیمات هر صفحه جداگانه در بخش «صفحه‌ها» است.
        </p>
      </header>

      <form action={saveSettings} className="flex flex-col gap-10">
        {/* بقیه تنظیمات فروشگاه دست‌نخورده منتقل می‌شوند */}
        {hidden.map((key) => {
          const value = settings[key];
          if (typeof value === "boolean") {
            return <input key={key} type="hidden" name={key} value={value ? "true" : "false"} />;
          }
          return <input key={key} type="hidden" name={key} value={String(value)} />;
        })}

        <Section title="عنوان و توضیح">
          <div className="panel flex flex-col gap-5 p-6">
            {TEXT_FIELDS.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="field-label">{field.label}</span>
                {field.rows ? (
                  <textarea
                    name={field.key}
                    rows={field.rows}
                    defaultValue={String(settings[field.key] ?? "")}
                    className="field w-full leading-8"
                  />
                ) : (
                  <input
                    name={field.key}
                    defaultValue={String(settings[field.key] ?? "")}
                    className="field"
                  />
                )}
                {field.hint ? (
                  <span className="block pt-1 text-[11px] leading-5 text-faint">{field.hint}</span>
                ) : null}
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="داده ساختاریافته"
          hint="اسکیما همان چیزی است که باعث می‌شود نتیجه شما در گوگل بزرگ‌تر و کامل‌تر از رقیب دیده شود."
        >
          <div className="panel flex flex-col gap-4 p-6">
            {SCHEMA_TOGGLES.map((t) => (
              <label key={t.key} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name={t.key}
                  defaultChecked={Boolean(settings[t.key])}
                  className="mt-1 size-4 shrink-0"
                />
                <span>
                  {t.label}
                  <span className="block pt-0.5 text-[11px] leading-5 text-faint">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="نقشه سایت"
          hint="خاموش کردن یک خانواده، آن آدرس‌ها را از نقشه سایت برمی‌دارد ولی صفحه‌ها همچنان در دسترس می‌مانند."
        >
          <div className="panel flex flex-col gap-4 p-6">
            {SITEMAP_TOGGLES.map((t) => (
              <label key={t.key} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name={t.key}
                  defaultChecked={Boolean(settings[t.key])}
                  className="mt-1 size-4 shrink-0"
                />
                <span>
                  {t.label}
                  {t.hint ? (
                    <span className="block pt-0.5 text-[11px] leading-5 text-faint">{t.hint}</span>
                  ) : null}
                </span>
              </label>
            ))}

            <div className="border-t border-line pt-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="seo.autoNoindexThin"
                  defaultChecked={Boolean(settings["seo.autoNoindexThin"])}
                  className="mt-1 size-4 shrink-0"
                />
                <span>
                  صفحه‌های کم‌محتوا خودکار از ایندکس خارج شوند
                  <span className="block pt-0.5 text-[11px] leading-5 text-faint">
                    وقتی هزاران صفحه نازک دارید، گوگل بودجه خزشش را روی آن‌ها هدر می‌دهد و
                    صفحه‌های خوبتان دیرتر دیده می‌شوند. با تولید محتوا این را خاموش کنید.
                  </span>
                </span>
              </label>

              <label className="block max-w-xs pt-4 text-sm">
                <span className="field-label">آستانه کم‌محتوا (کلمه)</span>
                <input
                  name="seo.thinWordThreshold"
                  type="number"
                  defaultValue={Number(settings["seo.thinWordThreshold"])}
                  className="field tnum"
                />
              </label>
            </div>
          </div>
        </Section>

        <Actions>
          <button type="submit" className="btn btn-brass px-8">
            ذخیره تنظیمات
          </button>
        </Actions>
      </form>
    </div>
  );
}
