"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SeoEntity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderTemplate, type Slot } from "@/lib/seo-content";
import { DEFAULT_TEMPLATES } from "@/lib/seo-defaults";
import {
  buildPartVars,
  buildModelVars,
  buildCarCategoryVars,
  buildCategoryVars,
  partVarsInclude,
} from "@/lib/seo-vars";
import { listCarCategoryPairs } from "@/lib/seo-inventory";

const SLOTS: Slot[] = ["metaTitle", "metaDescription", "h1", "intro", "body"];

function str(form: FormData, key: string): string | null {
  const raw = form.get(key);
  if (raw === null) return null;
  const trimmed = String(raw).trim();
  return trimmed === "" ? null : trimmed;
}

/** ذخیره محتوای سئوی یک صفحه */
export async function saveSeoContent(formData: FormData) {
  const entityType = String(formData.get("entityType")) as SeoEntity;
  const entityKey = String(formData.get("entityKey"));
  if (!entityType || !entityKey) return;

  const data = {
    metaTitle: str(formData, "metaTitle"),
    metaDescription: str(formData, "metaDescription"),
    h1: str(formData, "h1"),
    intro: str(formData, "intro"),
    body: str(formData, "body"),
    noindex: formData.get("noindex") === "on",
    // ویرایش دستی یعنی دیگر با تولید گروهی بازنویسی نشود
    isGenerated: false,
  };

  await prisma.seoContent.upsert({
    where: { entityType_entityKey: { entityType, entityKey } },
    create: { entityType, entityKey, ...data },
    update: data,
  });

  revalidatePath("/admin/seo");
  revalidatePath("/admin/seo/pages");
  const back = str(formData, "returnTo");
  if (back) redirect(back);
}

/** پاک کردن محتوای دستی یک صفحه؛ صفحه به قالب برمی‌گردد */
export async function resetSeoContent(formData: FormData) {
  const entityType = String(formData.get("entityType")) as SeoEntity;
  const entityKey = String(formData.get("entityKey"));
  await prisma.seoContent
    .delete({ where: { entityType_entityKey: { entityType, entityKey } } })
    .catch(() => null);
  revalidatePath("/admin/seo/pages");
  const back = str(formData, "returnTo");
  if (back) redirect(back);
}

/** ذخیره یک قالب */
export async function saveTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const template = String(formData.get("template") ?? "");
  const isActive = formData.get("isActive") === "on";
  const nameFa = String(formData.get("nameFa") ?? "").trim();

  if (id) {
    await prisma.contentTemplate.update({
      where: { id },
      data: { template, isActive, ...(nameFa ? { nameFa } : {}) },
    });
  } else {
    const key = String(formData.get("key") ?? "").trim();
    const entityType = String(formData.get("entityType")) as SeoEntity;
    const slot = String(formData.get("slot"));
    if (!key || !entityType || !slot) return;
    await prisma.contentTemplate.create({
      data: { key, nameFa: nameFa || key, entityType, slot, template, isActive },
    });
  }

  revalidatePath("/admin/seo/templates");
}

/** برگرداندن قالب‌ها به حالت پیش‌فرض؛ قالب‌های سفارشی دست‌نخورده می‌مانند */
export async function restoreDefaultTemplates() {
  for (const seed of DEFAULT_TEMPLATES) {
    await prisma.contentTemplate.upsert({
      where: { key: seed.key },
      create: seed,
      update: {
        nameFa: seed.nameFa,
        hintFa: seed.hintFa,
        entityType: seed.entityType,
        slot: seed.slot,
        template: seed.template,
        isActive: true,
      },
    });
  }
  revalidatePath("/admin/seo/templates");
  revalidatePath("/admin/seo");
}

/**
 * تولید گروهی محتوا از روی قالب‌ها.
 *
 * سه حالت دارد و پیش‌فرض امن‌ترین است:
 *   empty     — فقط صفحه‌هایی که هیچ محتوایی ندارند
 *   generated — صفحه‌هایی که قبلاً خودکار ساخته شده‌اند هم به‌روز شوند
 *   all       — همه، حتی متن‌های دستی (هشدار داده می‌شود)
 */
export async function bulkGenerate(formData: FormData) {
  const entityType = String(formData.get("entityType")) as SeoEntity;
  const mode = String(formData.get("mode") ?? "empty");
  const limit = Math.min(20_000, Math.max(1, Number(formData.get("limit")) || 1000));

  const templates = await prisma.contentTemplate.findMany({
    where: { entityType, isActive: true },
  });
  if (templates.length === 0) return;

  const existing = await prisma.seoContent.findMany({
    where: { entityType },
    select: { entityKey: true, isGenerated: true },
  });
  const seen = new Map(existing.map((e) => [e.entityKey, e.isGenerated]));

  const skip = (key: string) => {
    if (!seen.has(key)) return false;
    if (mode === "all") return false;
    if (mode === "generated") return seen.get(key) === false; // دستی را دست نزن
    return true; // mode === "empty"
  };

  const targets: Array<{ key: string; vars: Awaited<ReturnType<typeof buildModelVars>> }> = [];

  if (entityType === "PART") {
    const parts = await prisma.part.findMany({
      where: { isActive: true },
      include: partVarsInclude,
      take: limit + existing.length,
    });
    for (const part of parts) {
      if (skip(part.id)) continue;
      targets.push({ key: part.id, vars: buildPartVars(part) });
      if (targets.length >= limit) break;
    }
  } else if (entityType === "CAR_MODEL") {
    const models = await prisma.vehicleModel.findMany({ where: { isActive: true } });
    for (const model of models) {
      if (skip(model.id)) continue;
      targets.push({ key: model.id, vars: await buildModelVars(model.id) });
      if (targets.length >= limit) break;
    }
  } else if (entityType === "CAR_CATEGORY") {
    const pairs = await listCarCategoryPairs();
    for (const pair of pairs) {
      const key = `${pair.modelId}:${pair.categoryId}`;
      if (skip(key)) continue;
      targets.push({ key, vars: await buildCarCategoryVars(pair.modelId, pair.categoryId) });
      if (targets.length >= limit) break;
    }
  } else if (entityType === "CATEGORY") {
    const cats = await prisma.partCategory.findMany({ where: { isActive: true } });
    for (const cat of cats) {
      if (skip(cat.id)) continue;
      targets.push({ key: cat.id, vars: await buildCategoryVars(cat.id) });
      if (targets.length >= limit) break;
    }
  }

  for (const target of targets) {
    const built: Record<string, string | null> = {};
    for (const slot of SLOTS) {
      const tpl = templates.find((t) => t.slot === slot);
      built[slot] = tpl ? renderTemplate(tpl.template, target.vars) || null : null;
    }

    await prisma.seoContent.upsert({
      where: { entityType_entityKey: { entityType, entityKey: target.key } },
      create: { entityType, entityKey: target.key, ...built, isGenerated: true },
      update: { ...built, isGenerated: true },
    });
  }

  revalidatePath("/admin/seo");
  revalidatePath("/admin/seo/pages");
  revalidatePath("/admin/seo/generate");
}

/** پاک کردن همه محتوای تولیدشده خودکار یک نوع صفحه */
export async function clearGenerated(formData: FormData) {
  const entityType = String(formData.get("entityType")) as SeoEntity;
  await prisma.seoContent.deleteMany({ where: { entityType, isGenerated: true } });
  revalidatePath("/admin/seo");
  revalidatePath("/admin/seo/generate");
}
