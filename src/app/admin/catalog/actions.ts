"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { normalizePartNumber } from "@/lib/normalize";
import type { Prisma } from "@prisma/client";

/**
 * ساخت و ویرایش خود کاتالوگ — قطعه، شماره فنی، سازگاری، پیشنهاد فروش،
 * تصویر، دسته، برند، تامین‌کننده و درخت خودرو.
 *
 * تا پیش از این فقط قیمت قطعه موجود از پنل قابل تغییر بود و برای افزودن یک
 * قطعه تازه باید اسکریپت ایمپورت اجرا می‌شد. این فایل همان شکاف را می‌بندد.
 */

// ------------------------------ ابزار مشترک ------------------------------

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function optional(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === "" ? null : value;
}

function number(form: FormData, key: string): number | null {
  const value = text(form, key);
  if (value === "") return null;
  const n = Number(value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
  return Number.isFinite(n) ? n : null;
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

/** اسلاگ فارسی — همان قاعده‌ای که در فارسی‌سازی آدرس‌ها استفاده شد */
export async function slugify(input: string): Promise<string> {
  return (
    input
      .trim()
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[^؀-ۿa-zA-Z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || `p-${Date.now().toString(36)}`
  );
}

/** اسلاگ یکتا در یک جدول؛ اگر تکراری بود عدد می‌گیرد */
async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = base;
  let i = 2;
  while (await exists(slug)) {
    slug = `${base}-${i++}`;
    if (i > 200) return `${base}-${Date.now().toString(36)}`;
  }
  return slug;
}

// -------------------------------- قطعه --------------------------------

/** ساخت قطعه جدید؛ به صفحه ویرایش همان قطعه می‌رود */
export async function createPart(formData: FormData) {
  const nameFa = text(formData, "nameFa");
  const categoryId = text(formData, "categoryId");
  if (!nameFa || !categoryId) return;

  const base = await slugify(nameFa);
  const slug = await uniqueSlug(base, async (s) =>
    Boolean(await prisma.part.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  const part = await prisma.part.create({
    data: {
      slug,
      nameFa,
      titleFa: optional(formData, "titleFa"),
      nameEn: optional(formData, "nameEn"),
      categoryId,
      brandId: optional(formData, "brandId"),
      description: optional(formData, "description"),
      isActive: true,
      minOrderQty: number(formData, "minOrderQty") ?? 1,
    },
  });

  // هر قطعه دست‌کم یک پیشنهاد فروش لازم دارد تا در سایت قابل نمایش باشد
  await prisma.offer.create({
    data: { partId: part.id, isDefault: true, stockQty: 0, leadTimeDays: 0 },
  });

  const primaryNumber = text(formData, "partNumber");
  if (primaryNumber) {
    await prisma.partNumber.create({
      data: {
        partId: part.id,
        number: primaryNumber,
        normalized: normalizePartNumber(primaryNumber),
        type: "OEM",
        isPrimary: true,
      },
    });
  }

  await logAudit({ action: "create", entity: "part", entityId: part.id, after: { nameFa, slug } });
  revalidatePath("/admin/parts");
  redirect(`/admin/parts/${part.id}`);
}

/** ویرایش مشخصات قطعه — جدا از قیمت‌گذاری که اکشن خودش را دارد */
export async function updatePart(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const before = await prisma.part.findUnique({ where: { id } });
  if (!before) return;

  const nameFa = text(formData, "nameFa") || before.nameFa;
  const rawSlug = text(formData, "slug");
  let slug = before.slug;

  if (rawSlug && rawSlug !== before.slug) {
    const base = await slugify(rawSlug);
    slug = await uniqueSlug(base, async (s) =>
      Boolean(
        await prisma.part.findFirst({ where: { slug: s, NOT: { id } }, select: { id: true } }),
      ),
    );
    // آدرس عوض شد: ریدایرکت خودکار از آدرس قبلی تا رتبه گوگل از دست نرود
    await upsertRedirectRow(
      `/part/${encodeURIComponent(before.slug)}`,
      `/part/${encodeURIComponent(slug)}`,
      "ساخته‌شده هنگام تغییر آدرس قطعه",
    );
  }

  const after = await prisma.part.update({
    where: { id },
    data: {
      nameFa,
      slug,
      titleFa: optional(formData, "titleFa"),
      nameEn: optional(formData, "nameEn"),
      categoryId: text(formData, "categoryId") || before.categoryId,
      brandId: optional(formData, "brandId"),
      description: optional(formData, "description"),
      weightGram: number(formData, "weightGram"),
      lengthMm: number(formData, "lengthMm"),
      widthMm: number(formData, "widthMm"),
      heightMm: number(formData, "heightMm"),
      minOrderQty: number(formData, "minOrderQty") ?? 1,
      isActive: bool(formData, "isActive"),
      isFeatured: bool(formData, "isFeatured"),
    },
  });

  await logAudit({ action: "update", entity: "part", entityId: id, before, after });
  revalidatePath(`/admin/parts/${id}`);
  revalidatePath(`/part/${encodeURIComponent(slug)}`);
}

export async function deletePart(formData: FormData) {
  const id = text(formData, "id");
  const before = await prisma.part.findUnique({ where: { id } });
  if (!before) return;

  await prisma.part.delete({ where: { id } });
  await logAudit({ action: "delete", entity: "part", entityId: id, before });
  revalidatePath("/admin/parts");
  redirect("/admin/parts");
}

// ----------------------------- شماره فنی -----------------------------

export async function addPartNumber(formData: FormData) {
  const partId = text(formData, "partId");
  const raw = text(formData, "number");
  if (!partId || !raw) return;

  const isPrimary = bool(formData, "isPrimary");
  if (isPrimary) {
    await prisma.partNumber.updateMany({ where: { partId }, data: { isPrimary: false } });
  }

  const created = await prisma.partNumber.create({
    data: {
      partId,
      number: raw,
      normalized: normalizePartNumber(raw),
      type: (optional(formData, "type") ?? "OEM") as never,
      isPrimary,
      note: optional(formData, "note"),
      brandId: optional(formData, "brandId"),
    },
  });

  await logAudit({ action: "create", entity: "partNumber", entityId: created.id, after: created });
  revalidatePath(`/admin/parts/${partId}`);
}

export async function deletePartNumber(formData: FormData) {
  const id = text(formData, "id");
  const partId = text(formData, "partId");
  await prisma.partNumber.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "partNumber", entityId: id });
  revalidatePath(`/admin/parts/${partId}`);
}

// ------------------------------ سازگاری ------------------------------

export async function addFitment(formData: FormData) {
  const partId = text(formData, "partId");
  const generationId = optional(formData, "generationId");
  if (!partId || !generationId) return;

  // برند و مدل از خود نسل خوانده می‌شوند تا داده ناسازگار ثبت نشود
  const generation = await prisma.vehicleGeneration.findUnique({
    where: { id: generationId },
    include: { model: { include: { make: true } } },
  });
  if (!generation) return;

  const created = await prisma.fitment.create({
    data: {
      partId,
      generationId,
      modelId: generation.modelId,
      makeId: generation.model.makeId,
      trimId: optional(formData, "trimId"),
      position: (optional(formData, "position") ?? "UNIVERSAL") as never,
      yearFrom: number(formData, "yearFrom"),
      yearTo: number(formData, "yearTo"),
      note: optional(formData, "note"),
    },
  });

  await logAudit({ action: "create", entity: "fitment", entityId: created.id, after: created });
  revalidatePath(`/admin/parts/${partId}`);
}

export async function deleteFitment(formData: FormData) {
  const id = text(formData, "id");
  const partId = text(formData, "partId");
  await prisma.fitment.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "fitment", entityId: id });
  revalidatePath(`/admin/parts/${partId}`);
}

// --------------------------- پیشنهاد فروش ---------------------------

export async function createOffer(formData: FormData) {
  const partId = text(formData, "partId");
  if (!partId) return;

  const created = await prisma.offer.create({
    data: {
      partId,
      brandId: optional(formData, "brandId"),
      supplierId: optional(formData, "supplierId"),
      sku: optional(formData, "sku"),
      stockQty: number(formData, "stockQty") ?? 0,
      leadTimeDays: number(formData, "leadTimeDays") ?? 0,
      warehouseNote: optional(formData, "warehouseNote"),
    },
  });

  await logAudit({ action: "create", entity: "offer", entityId: created.id, after: created });
  revalidatePath(`/admin/parts/${partId}`);
}

export async function deleteOffer(formData: FormData) {
  const id = text(formData, "id");
  const partId = text(formData, "partId");
  await prisma.offer.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "offer", entityId: id });
  revalidatePath(`/admin/parts/${partId}`);
}

/** انتخاب پیشنهاد پیش‌فرض؛ همان است که در سایت نمایش داده می‌شود */
export async function setDefaultOffer(formData: FormData) {
  const id = text(formData, "id");
  const partId = text(formData, "partId");
  if (!id || !partId) return;
  await prisma.offer.updateMany({ where: { partId }, data: { isDefault: false } });
  await prisma.offer.update({ where: { id }, data: { isDefault: true } });
  await logAudit({ action: "update", entity: "offer", entityId: id, after: { isDefault: true } });
  revalidatePath(`/admin/parts/${partId}`);
}

// ----------------------------- تصویر قطعه -----------------------------

export async function addPartImage(formData: FormData) {
  const partId = text(formData, "partId");
  const url = text(formData, "url");
  if (!partId || !url) return;

  const count = await prisma.partImage.count({ where: { partId } });
  const created = await prisma.partImage.create({
    data: { partId, url, alt: optional(formData, "alt"), sortOrder: count },
  });

  await logAudit({ action: "create", entity: "partImage", entityId: created.id, after: created });
  revalidatePath(`/admin/parts/${partId}`);
}

export async function deletePartImage(formData: FormData) {
  const id = text(formData, "id");
  const partId = text(formData, "partId");
  await prisma.partImage.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "partImage", entityId: id });
  revalidatePath(`/admin/parts/${partId}`);
}

// ------------------------ دسته، برند، تامین‌کننده ------------------------

export async function saveCategory(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  if (!nameFa) return;

  const data = {
    nameFa,
    nameEn: optional(formData, "nameEn"),
    parentId: optional(formData, "parentId"),
    sortOrder: number(formData, "sortOrder") ?? 0,
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.partCategory.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "category", entityId: id, after: data });
  } else {
    const slug = await uniqueSlug(await slugify(text(formData, "slug") || nameFa), async (s) =>
      Boolean(await prisma.partCategory.findUnique({ where: { slug: s }, select: { id: true } })),
    );
    const created = await prisma.partCategory.create({ data: { ...data, slug } });
    await logAudit({ action: "create", entity: "category", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/taxonomy");
  revalidatePath("/catalog");
}

export async function deleteCategory(formData: FormData) {
  const id = text(formData, "id");
  const count = await prisma.part.count({ where: { categoryId: id } });
  // دسته‌ای که قطعه دارد نباید حذف شود وگرنه قطعه‌ها بی‌صاحب می‌مانند
  if (count > 0) return;
  await prisma.partCategory.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "category", entityId: id });
  revalidatePath("/admin/catalog/taxonomy");
}

export async function saveBrand(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  if (!nameFa) return;

  const data = {
    nameFa,
    nameEn: optional(formData, "nameEn"),
    country: optional(formData, "country"),
    qualityTier: (optional(formData, "qualityTier") ?? "AFTERMARKET") as never,
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.partBrand.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "brand", entityId: id, after: data });
  } else {
    const slug = await uniqueSlug(await slugify(nameFa), async (s) =>
      Boolean(await prisma.partBrand.findUnique({ where: { slug: s }, select: { id: true } })),
    );
    const created = await prisma.partBrand.create({ data: { ...data, slug } });
    await logAudit({ action: "create", entity: "brand", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/taxonomy");
}

export async function saveSupplier(formData: FormData) {
  const id = optional(formData, "id");
  const name = text(formData, "name");
  if (!name) return;

  const data = {
    name,
    phone: optional(formData, "phone"),
    telegram: optional(formData, "telegram"),
    note: optional(formData, "note"),
    defaultLeadDays: number(formData, "defaultLeadDays") ?? 0,
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.supplier.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "supplier", entityId: id, after: data });
  } else {
    const created = await prisma.supplier.create({ data });
    await logAudit({ action: "create", entity: "supplier", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/taxonomy");
}

// ---------------------------- درخت خودرو ----------------------------

export async function saveMake(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  if (!nameFa) return;

  const data = {
    nameFa,
    nameEn: text(formData, "nameEn") || nameFa,
    sortOrder: number(formData, "sortOrder") ?? 0,
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.vehicleMake.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "make", entityId: id, after: data });
  } else {
    const slug = await uniqueSlug(await slugify(data.nameEn), async (s) =>
      Boolean(await prisma.vehicleMake.findUnique({ where: { slug: s }, select: { id: true } })),
    );
    const created = await prisma.vehicleMake.create({ data: { ...data, slug } });
    await logAudit({ action: "create", entity: "make", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/vehicles");
  revalidatePath("/vehicles");
}

export async function saveModel(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  const makeId = text(formData, "makeId");
  if (!nameFa || !makeId) return;

  const nameEn = text(formData, "nameEn") || nameFa;
  const before = id ? await prisma.vehicleModel.findUnique({ where: { id } }) : null;

  const data = {
    makeId,
    nameFa,
    nameEn,
    sortOrder: number(formData, "sortOrder") ?? 0,
    isActive: bool(formData, "isActive"),
  };

  if (id && before) {
    const rawSlug = text(formData, "slug");
    let slug = before.slug;
    if (rawSlug && rawSlug !== before.slug) {
      slug = await slugify(rawSlug);
      const make = await prisma.vehicleMake.findUnique({ where: { id: makeId } });
      if (make) {
        await upsertRedirectRow(
          `/car/${make.slug}/${before.slug}`,
          `/car/${make.slug}/${slug}`,
          "ساخته‌شده هنگام تغییر آدرس خودرو",
        );
      }
    }
    await prisma.vehicleModel.update({ where: { id }, data: { ...data, slug } });
    await logAudit({ action: "update", entity: "model", entityId: id, before, after: data });
  } else {
    const slug = await uniqueSlug(await slugify(text(formData, "slug") || nameEn), async (s) =>
      Boolean(
        await prisma.vehicleModel.findFirst({ where: { makeId, slug: s }, select: { id: true } }),
      ),
    );
    const created = await prisma.vehicleModel.create({ data: { ...data, slug } });
    await logAudit({ action: "create", entity: "model", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/vehicles");
  revalidatePath("/vehicles");
}

export async function saveGeneration(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  const modelId = text(formData, "modelId");
  const yearStart = number(formData, "yearStart");
  if (!nameFa || !modelId || !yearStart) return;

  const data = {
    modelId,
    nameFa,
    nameEn: text(formData, "nameEn") || nameFa,
    code: optional(formData, "code"),
    yearStart,
    yearEnd: number(formData, "yearEnd"),
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.vehicleGeneration.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "generation", entityId: id, after: data });
  } else {
    const slug = await uniqueSlug(await slugify(data.code || data.nameEn), async (s) =>
      Boolean(
        await prisma.vehicleGeneration.findFirst({
          where: { modelId, slug: s },
          select: { id: true },
        }),
      ),
    );
    const created = await prisma.vehicleGeneration.create({ data: { ...data, slug } });
    await logAudit({ action: "create", entity: "generation", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/vehicles");
}

export async function saveTrim(formData: FormData) {
  const id = optional(formData, "id");
  const nameFa = text(formData, "nameFa");
  const generationId = text(formData, "generationId");
  if (!nameFa || !generationId) return;

  const data: Prisma.VehicleTrimUncheckedCreateInput = {
    generationId,
    slug: await slugify(text(formData, "nameEn") || nameFa),
    nameFa,
    nameEn: text(formData, "nameEn") || nameFa,
    engineCode: optional(formData, "engineCode"),
    fuel: (optional(formData, "fuel") ?? "PETROL") as never,
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    const { slug: _drop, ...rest } = data;
    await prisma.vehicleTrim.update({ where: { id }, data: rest });
    await logAudit({ action: "update", entity: "trim", entityId: id, after: rest });
  } else {
    const created = await prisma.vehicleTrim.create({ data });
    await logAudit({ action: "create", entity: "trim", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/vehicles");
}

// --------------------------- قاعده شماره شاسی ---------------------------

export async function saveVinRule(formData: FormData) {
  const id = optional(formData, "id");
  const makeId = text(formData, "makeId");
  const wmi = text(formData, "wmi").toUpperCase();
  if (!makeId || !wmi) return;

  const data = {
    makeId,
    wmi,
    pattern: optional(formData, "pattern"),
    modelHint: optional(formData, "modelHint"),
    note: optional(formData, "note"),
    isActive: bool(formData, "isActive"),
  };

  if (id) {
    await prisma.vinRule.update({ where: { id }, data });
    await logAudit({ action: "update", entity: "vinRule", entityId: id, after: data });
  } else {
    const created = await prisma.vinRule.create({ data });
    await logAudit({ action: "create", entity: "vinRule", entityId: created.id, after: created });
  }
  revalidatePath("/admin/catalog/vin-rules");
  revalidatePath("/vin");
}

export async function deleteVinRule(formData: FormData) {
  const id = text(formData, "id");
  await prisma.vinRule.delete({ where: { id } }).catch(() => null);
  await logAudit({ action: "delete", entity: "vinRule", entityId: id });
  revalidatePath("/admin/catalog/vin-rules");
}

// --------------------------- کمکی ریدایرکت ---------------------------

/**
 * ریدایرکت خودکار وقتی آدرسی عوض می‌شود.
 * اینجا تعریف شده و نه در فایل ریدایرکت‌ها، تا تغییر آدرس در همین ماژول
 * کامل باشد و کسی یادش نرود ریدایرکتش را بسازد.
 */
async function upsertRedirectRow(source: string, destination: string, note: string) {
  if (source === destination) return;
  const { invalidateRedirectCache, normalizePath } = await import("@/lib/redirects");
  await prisma.redirect.upsert({
    where: { source: normalizePath(source) },
    create: { source: normalizePath(source), destination, permanent: true, note },
    update: { destination, isActive: true },
  });
  // ریدایرکت‌های زنجیره‌ای را صاف می‌کنیم: هر چه به مبدأ می‌رسید، حالا به مقصد جدید برود
  await prisma.redirect.updateMany({
    where: { destination: normalizePath(source) },
    data: { destination },
  });
  invalidateRedirectCache();
}
