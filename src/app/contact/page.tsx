import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با کارشناسان قطعات کیا و هیوندا: تلفن، واتساپ، تلگرام و فرم استعلام.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const phone = String(settings["store.phone"] ?? "");
  const whatsapp = String(settings["inquiry.whatsappNumber"] ?? "");
  const telegram = String(settings["inquiry.telegramUsername"] ?? "");

  return (
    <div>
      <PageHeader
        eyebrow="contact"
        title="با کارشناس قطعه حرف بزنید"
        lede="برای سازگاری قطعه، استعلام قیمت یا پیگیری سفارش، از هر کدام از این راه‌ها در دسترسیم."
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="panel p-6">
            <div className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-brass-dark">
              phone
            </div>
            <h2 className="pt-3 font-display text-base font-bold">تلفن فروشگاه</h2>
            {phone ? (
              <a href={`tel:${phone}`} className="mono pt-2 block text-lg font-bold">
                {phone}
              </a>
            ) : (
              <p className="pt-2 text-sm text-muted">
                شماره تلفن هنوز در پنل مدیریت ثبت نشده است.
              </p>
            )}
            <p className="pt-2 text-xs text-faint">شنبه تا چهارشنبه ۹ تا ۱۸، پنجشنبه ۹ تا ۱۳</p>
          </div>

          <div className="panel p-6">
            <div className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-brass-dark">
              messaging
            </div>
            <h2 className="pt-3 font-display text-base font-bold">واتساپ و تلگرام</h2>
            <p className="pt-2 text-sm leading-7 text-muted">
              عکس قطعه یا شماره شاسی را بفرستید؛ سریع‌ترین راه برای تشخیص قطعه درست.
            </p>
            <div className="flex flex-wrap gap-2 pt-4">
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-brass px-4 py-2 text-xs"
                >
                  واتساپ
                </a>
              ) : null}
              {telegram ? (
                <a
                  href={`https://t.me/${telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost px-4 py-2 text-xs"
                >
                  تلگرام
                </a>
              ) : null}
              {!whatsapp && !telegram ? (
                <p className="text-xs text-faint">
                  آدرس واتساپ و تلگرام هنوز در پنل مدیریت ثبت نشده است.
                </p>
              ) : null}
            </div>
          </div>

          <div className="panel panel-brass p-6">
            <div className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-brass-dark">
              inquiry
            </div>
            <h2 className="pt-3 font-display text-base font-bold">فرم استعلام</h2>
            <p className="pt-2 text-sm leading-7 text-muted">
              اگر عجله ندارید، فرم را پر کنید. درخواست ثبت می‌شود و پیگیری‌اش گم نمی‌شود.
            </p>
            <Link href="/inquiry" className="btn btn-primary mt-4 px-4 py-2 text-xs">
              ثبت درخواست
            </Link>
          </div>
        </div>

        <section className="pt-12">
          <div className="rule pb-5">
            <h2 className="font-display text-lg font-black">قبل از تماس، این را آماده داشته باشید</h2>
            <span className="rule-label">checklist</span>
          </div>
          <ul className="max-w-[68ch] list-disc space-y-2 pr-6 leading-8 text-muted marker:text-brass">
            <li>برند، مدل و سال خودرو — ترجیحاً از روی کارت خودرو</li>
            <li>شماره فنی قطعه فعلی، اگر قابل خواندن است</li>
            <li>شماره شاسی، اگر از نسل خودرو مطمئن نیستید</li>
            <li>سمت قطعه: چپ یا راست، جلو یا عقب</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
