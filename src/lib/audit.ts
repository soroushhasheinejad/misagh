import { prisma } from "@/lib/prisma";

/**
 * ثبت تغییرات پنل.
 *
 * وقتی چند نفر به پنل دسترسی دارند، «چه کسی قیمت این قطعه را عوض کرد» سوالی
 * است که باید جواب داشته باشد. هر اکشن نوشتنی پنل از اینجا رد می‌شود.
 *
 * خطای ثبت لاگ نباید خود عملیات را بخواباند، پس همه‌چیز داخل try است.
 */
export async function logAudit(input: {
  action: "create" | "update" | "delete" | "generate";
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        before: (input.before ?? null) as never,
        after: (input.after ?? null) as never,
      },
    });
  } catch {
    // ثبت لاگ نباید مانع کار مدیر شود
  }
}

/** برچسب فارسی موجودیت‌ها برای صفحه گزارش */
export const AUDIT_ENTITY: Record<string, string> = {
  part: "قطعه",
  partNumber: "شماره فنی",
  fitment: "سازگاری",
  offer: "پیشنهاد فروش",
  partImage: "تصویر قطعه",
  category: "دسته",
  brand: "برند قطعه",
  supplier: "تامین‌کننده",
  make: "برند خودرو",
  model: "مدل خودرو",
  generation: "نسل خودرو",
  trim: "تیپ خودرو",
  vinRule: "قاعده شماره شاسی",
  seoContent: "محتوای سئو",
  contentTemplate: "قالب محتوا",
  redirect: "ریدایرکت",
  settings: "تنظیمات",
  rate: "نرخ ارز",
  post: "مقاله",
  inquiry: "استعلام",
  order: "سفارش",
};

export const AUDIT_ACTION: Record<string, string> = {
  create: "ساخت",
  update: "ویرایش",
  delete: "حذف",
  generate: "تولید گروهی",
};
