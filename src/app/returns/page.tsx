import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "ضمانت و مرجوعی",
  description: "شرایط بازگشت قطعه، ضمانت اصالت و مواردی که امکان مرجوعی ندارند.",
};

export default function ReturnsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="warranty"
        title="ضمانت اصالت و شرایط مرجوعی"
        lede="قطعه‌ای که با برچسب جنیون فروخته شود و جنیون نباشد، بدون بحث بازگردانده می‌شود."
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="max-w-[68ch]">
            <h2 className="pb-3 font-display text-xl font-black">ضمانت اصالت</h2>
            <p className="pb-6 leading-9 text-muted">
              برای هر پیشنهاد فروش، برند و تراز کیفیت روی سایت نوشته شده است. اگر قطعه‌ای که تحویل
              گرفتید با آن مشخصات نخواند، هزینه کامل را برمی‌گردانیم و هزینه ارسال برگشت هم با
              ماست.
            </p>

            <h2 className="pb-3 pt-4 font-display text-xl font-black">مهلت بازگشت</h2>
            <ul className="list-disc space-y-2 pb-6 pr-6 leading-8 text-muted marker:text-brass">
              <li>
                <strong className="font-display text-ink">هفت روز</strong> از زمان تحویل، برای قطعه
                باز نشده و در بسته‌بندی اصلی
              </li>
              <li>
                <strong className="font-display text-ink">۴۸ ساعت</strong> برای اعلام مغایرت قطعه با
                سفارش — مثلاً کد اشتباه یا سمت اشتباه
              </li>
              <li>قطعه معیوب: در تمام دوره ضمانت همان برند</li>
            </ul>

            <h2 className="pb-3 pt-4 font-display text-xl font-black">
              چه چیزهایی مرجوع نمی‌شود
            </h2>
            <ul className="list-disc space-y-2 pb-6 pr-6 leading-8 text-muted marker:text-alert">
              <li>قطعه‌ای که نصب شده یا آثار نصب دارد</li>
              <li>قطعات برقی و الکترونیکی پس از باز شدن بسته‌بندی — طبق رویه سازنده</li>
              <li>قطعه‌ای که به سفارش مشتری و خارج از موجودی انبار وارد شده است</li>
              <li>مایعات و روانکارهای باز شده</li>
            </ul>

            <h2 className="pb-3 pt-4 font-display text-xl font-black">مسیر مرجوعی</h2>
            <ol className="list-decimal space-y-2 pr-6 leading-8 text-muted marker:font-mono marker:text-brass">
              <li>با شماره سفارش تماس بگیرید یا در واتساپ پیام بدهید.</li>
              <li>عکس قطعه و بسته‌بندی را بفرستید.</li>
              <li>پس از تایید، قطعه را با روش ارسالی که اعلام می‌کنیم برگردانید.</li>
              <li>مبلغ حداکثر تا سه روز کاری پس از رسیدن قطعه واریز می‌شود.</li>
            </ol>
          </div>

          <aside>
            <div className="panel panel-brass p-6">
              <h2 className="font-display text-base font-bold">قبل از خرید مطمئن شوید</h2>
              <p className="pt-2 text-sm leading-7 text-muted">
                بیشتر مرجوعی‌ها به‌خاطر انتخاب نسل اشتباه خودروست. اگر شک دارید، قبل از سفارش
                شماره شاسی را برای ما بفرستید.
              </p>
              <Link href="/vin" className="btn btn-primary mt-4 px-4 py-2 text-xs">
                بررسی با شماره شاسی
              </Link>
              <Link
                href="/blog/make-sure-part-fits"
                className="mt-3 block text-xs text-brass-dark link-brass"
              >
                راهنما: چطور مطمئن شویم قطعه می‌خورد ←
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
