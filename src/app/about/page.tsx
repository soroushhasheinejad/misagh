import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "فروشگاه تخصصی قطعات یدکی کیا و هیوندا با شماره فنی مشخص، موجودی واقعی و استعلام سریع.",
};

export default async function AboutPage() {
  const [parts, generations, categories] = await Promise.all([
    prisma.part.count({ where: { isActive: true } }),
    prisma.vehicleGeneration.count(),
    prisma.partCategory.count(),
  ]);

  const numbers = [
    { value: parts, label: "قطعه در کاتالوگ", hint: "parts" },
    { value: generations, label: "نسل خودرو تحت پوشش", hint: "vehicles" },
    { value: categories, label: "دسته‌بندی فنی", hint: "categories" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="about"
        title="ما فقط کیا و هیوندا کار می‌کنیم"
        lede="تخصصی بودن یعنی وقتی شماره فنی می‌دهید، طرف مقابل بداند از چه حرف می‌زنید."
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="max-w-[68ch]">
            <p className="pb-5 leading-9 text-muted">
              میثاق یدک از یک انبار قطعات کره‌ای شروع شد؛ جایی که سفارش‌ها با تلفن و تلگرام می‌آمد و
              هر استعلام قیمت یعنی چند دقیقه گشتن در فایل اکسل. این سایت همان انبار است، با این
              تفاوت که حالا مشتری خودش می‌تواند ببیند چه داریم، به چه خودرویی می‌خورد و چند است.
            </p>

            <h2 className="pb-3 pt-6 font-display text-xl font-black">چطور کار می‌کنیم</h2>
            <p className="pb-5 leading-9 text-muted">
              هر قطعه در سایت با شماره فنی سازنده ثبت شده، نه فقط با یک نام کلی. کدهای معادل و
              کدهای جایگزین‌شده به هم وصل‌اند، پس اگر کد قدیمی دارید هم به نتیجه می‌رسید. سازگاری
              هر قطعه با خودرو در جدول جدا نگه داشته می‌شود تا وقتی خودرویتان را انتخاب می‌کنید،
              فقط چیزی را ببینید که واقعاً به آن می‌خورد.
            </p>

            <h2 className="pb-3 pt-6 font-display text-xl font-black">درباره قیمت</h2>
            <p className="pb-5 leading-9 text-muted">
              بازار قطعات به دلار وابسته است و قیمت‌ها نوسان دارند. به‌جای اینکه قیمت‌های قدیمی و
              نادرست نشان بدهیم، برای قطعاتی که قیمتشان تثبیت شده عدد دقیق می‌گذاریم و برای بقیه
              دکمه استعلام. هر قیمتی که می‌بینید، تاریخ اعتبار دارد.
            </p>

            <h2 className="pb-3 pt-6 font-display text-xl font-black">درباره اصالت قطعه</h2>
            <p className="pb-5 leading-9 text-muted">
              برای هر پیشنهاد فروش، برند و تراز کیفیت جدا نوشته می‌شود — جنیون، سازنده اصلی، یا
              های‌کپی. قطعه‌ای را با برچسب اشتباه نمی‌فروشیم؛ اگر های‌کپی است، نوشته‌ایم های‌کپی.
              انتخاب با شماست.
            </p>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="panel divide-y divide-line">
              {numbers.map((n) => (
                <div key={n.label} className="p-5">
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                    {n.hint}
                  </div>
                  <div className="tnum pt-1 font-display text-2xl font-black">
                    {n.value.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-xs text-muted">{n.label}</div>
                </div>
              ))}
            </div>

            <div className="panel bg-carbon p-6 text-white">
              <h2 className="font-display text-base font-bold">قطعه‌تان را پیدا نکردید؟</h2>
              <p className="pt-2 text-sm leading-7 text-white/60">
                شماره فنی یا عکس قطعه را بفرستید؛ استعلام می‌کنیم و همان روز جواب می‌دهیم.
              </p>
              <Link href="/inquiry" className="btn btn-brass mt-4">
                ثبت استعلام
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
