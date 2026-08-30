import { faDigits } from "@/lib/format";

/**
 * استعلام قیمت با تماس مستقیم.
 *
 * قیمت روی سایت نشان داده نمی‌شود، پس تماس تلفنی کوتاه‌ترین مسیر بین دیدن
 * قطعه و بستن معامله است. شماره‌ها از تنظیمات فروشگاه می‌آیند تا بدون تغییر
 * کد قابل عوض کردن باشند.
 *
 * لینک tel با رقم لاتین ساخته می‌شود چون گوشی فقط همان را می‌فهمد، ولی متن
 * روی دکمه فارسی است.
 */
export function CallInquiry({
  phones,
  hours,
  variant = "block",
}: {
  phones: string[];
  hours?: string;
  variant?: "block" | "inline";
}) {
  const numbers = phones.map((p) => p.replace(/\s/g, "")).filter(Boolean);
  if (numbers.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {numbers.map((number) => (
          <a
            key={number}
            href={`tel:${number}`}
            className="btn btn-ghost tnum px-4 py-2 text-xs"
            dir="ltr"
          >
            {faDigits(number)}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="pb-2 text-xs text-muted">استعلام قیمت با تماس مستقیم</div>
      <div className="flex flex-col gap-2">
        {numbers.map((number) => (
          <a
            key={number}
            href={`tel:${number}`}
            className="btn btn-ghost tnum w-full justify-center py-2.5 text-sm"
            dir="ltr"
          >
            {faDigits(number)}
          </a>
        ))}
      </div>
      {hours ? <p className="pt-2 text-xs leading-6 text-faint">{hours}</p> : null}
    </div>
  );
}
