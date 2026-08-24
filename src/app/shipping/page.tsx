import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "ارسال و پرداخت",
  description: "روش‌های ارسال قطعات به سراسر کشور، زمان تحویل و راه‌های پرداخت.",
};

const METHODS = [
  {
    name: "پیک تهران",
    time: "همان روز",
    note: "سفارش‌های ثبت‌شده تا ساعت ۱۴، همان روز تحویل می‌شود.",
    cost: "بر اساس منطقه، هنگام تسویه محاسبه می‌شود",
  },
  {
    name: "تیپاکس",
    time: "۱ تا ۲ روز کاری",
    note: "مناسب قطعات سنگین مثل دیسک، کمک فنر و سپر.",
    cost: "بر اساس وزن و مقصد",
  },
  {
    name: "پست پیشتاز",
    time: "۲ تا ۴ روز کاری",
    note: "ارزان‌ترین گزینه برای قطعات سبک مثل فیلتر و شمع.",
    cost: "بر اساس وزن و مقصد",
  },
];

export default function ShippingPage() {
  return (
    <div>
      <PageHeader
        title="ارسال و پرداخت"
        lede="قطعه سنگین و سبک هزینه ارسال یکسان ندارند؛ کرایه بر اساس وزن واقعی قطعه محاسبه می‌شود."
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <section>
          <div className="rule pb-5">
            <h2 className="font-display text-lg font-black">روش‌های ارسال</h2>
          </div>

          <div className="overflow-x-auto rounded-md border border-line bg-surface">
            <table className="spec min-w-[640px]">
              <thead>
                <tr>
                  <th>روش</th>
                  <th>زمان تحویل</th>
                  <th>هزینه</th>
                  <th>توضیح</th>
                </tr>
              </thead>
              <tbody>
                {METHODS.map((m) => (
                  <tr key={m.name}>
                    <td className="font-display font-bold">{m.name}</td>
                    <td className="tnum text-muted">{m.time}</td>
                    <td className="text-muted">{m.cost}</td>
                    <td className="text-muted">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-10 pt-12 lg:grid-cols-2">
          <section>
            <div className="rule pb-5">
              <h2 className="font-display text-lg font-black">پرداخت</h2>
            </div>
            <ul className="list-disc space-y-2 pr-6 leading-8 text-muted marker:text-brass">
              <li>پرداخت آنلاین با کارت‌های عضو شتاب از طریق درگاه بانکی</li>
              <li>کارت به کارت با ارسال رسید — برای سفارش‌های تلفنی</li>
              <li>پرداخت در محل، فعلاً فقط برای تحویل با پیک در تهران و با سقف مبلغ</li>
              <li>قیمت همکار برای تعمیرگاه‌ها و فروشندگان، پس از احراز هویت</li>
            </ul>
          </section>

          <section>
            <div className="rule pb-5">
              <h2 className="font-display text-lg font-black">قیمت تا کی معتبر است</h2>
            </div>
            <p className="pb-4 leading-9 text-muted">
              چون بخشی از قیمت‌ها به نرخ ارز وابسته است، هر قیمت روی سایت تاریخ اعتبار دارد و کنار
              همان قیمت نوشته می‌شود. وقتی سفارش را ثبت می‌کنید، قیمت برای شما قفل می‌شود و تغییر
              نرخ روی سفارش ثبت‌شده اثر نمی‌گذارد.
            </p>
            <p className="leading-9 text-muted">
              برای قطعاتی که قیمتشان اعلام نشده، دکمه{" "}
              <Link href="/inquiry" className="text-brass-dark link-brass">
                استعلام قیمت
              </Link>{" "}
              را بزنید؛ قیمت روز را همان روز اعلام می‌کنیم.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
