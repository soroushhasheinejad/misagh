import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col items-start px-5 py-24">
      <div className="tnum font-display text-sm font-black text-brass">۴۰۴</div>
      <h1 className="pt-4 font-display text-3xl font-black">این صفحه پیدا نشد</h1>
      <p className="max-w-lg pt-3 leading-8 text-muted">
        شاید آدرس عوض شده باشد یا قطعه‌ای که دنبالش بودید از کاتالوگ برداشته شده باشد. از یکی از
        این مسیرها ادامه بدهید.
      </p>

      <div className="flex flex-wrap gap-3 pt-8">
        <Link href="/" className="btn btn-primary">
          صفحه اصلی
        </Link>
        <Link href="/search" className="btn btn-ghost">
          جستجوی شماره فنی
        </Link>
        <Link href="/vehicles" className="btn btn-ghost">
          فهرست خودروها
        </Link>
        <Link href="/inquiry" className="btn btn-ghost">
          استعلام قیمت
        </Link>
      </div>
    </div>
  );
}
