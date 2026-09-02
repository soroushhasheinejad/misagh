import { prisma } from "@/lib/prisma";
import { decodeVin, type VinInfo } from "@/lib/normalize";

/**
 * رمزگشایی شماره شاسی با قاعده‌های دیتابیس.
 *
 * تشخیص پایه — طول، رقم کنترلی، سال و کارخانه — در normalize انجام می‌شود و
 * منطق ثابت استانداردی است. ولی اینکه یک WMI مشخص به کدام برند و کدام مدل
 * می‌خورد چیزی است که با ورود مدل‌های تازه عوض می‌شود، پس از جدول VinRule
 * خوانده می‌شود تا از پنل قابل مدیریت باشد.
 *
 * قاعده دیتابیس روی نگاشت داخلی اولویت دارد؛ اگر قاعده‌ای نبود، همان نتیجه
 * پایه برمی‌گردد و چیزی خراب نمی‌شود.
 */

export type VinResult = VinInfo & {
  /** مدل حدس‌زده‌شده از روی قاعده */
  modelHint?: string;
  /** توضیح قاعده‌ای که خورد */
  ruleNote?: string;
};

export async function decodeVinWithRules(raw: string): Promise<VinResult> {
  const base = decodeVin(raw);
  if (!base.valid || !base.wmi) return base;

  const rules = await prisma.vinRule
    .findMany({
      where: { wmi: base.wmi, isActive: true },
      include: { make: true },
    })
    .catch(() => []);

  if (rules.length === 0) return base;

  // کاراکترهای ۴ تا ۸ همان بخشی است که مدل و بدنه را مشخص می‌کند
  const descriptor = base.vin.slice(3, 8);

  const matched =
    rules.find((rule) => {
      if (!rule.pattern) return false;
      try {
        return new RegExp(rule.pattern).test(descriptor);
      } catch {
        // الگوی معیوب در پنل نباید صفحه را بخواباند
        return false;
      }
    }) ?? rules.find((rule) => !rule.pattern);

  if (!matched) return base;

  return {
    ...base,
    makeSlug: matched.make.slug,
    makeName: matched.make.nameFa,
    modelHint: matched.modelHint ?? undefined,
    ruleNote: matched.note ?? undefined,
    // قاعده دیتابیس برند را قطعی می‌کند، پس خطای «کیا یا هیوندا نیست» برداشته می‌شود
    error: undefined,
  };
}
