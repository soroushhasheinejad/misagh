/**
 * ساخت قالب‌های پیش‌فرض و تولید محتوای سئو برای همه صفحه‌ها.
 *
 *   npx tsx scripts/seo-generate.mts            # فقط صفحه‌های بدون محتوا
 *   npx tsx scripts/seo-generate.mts --refresh  # متن‌های ساخته‌شده با قالب هم به‌روز شوند
 *
 * همان کاری را می‌کند که دکمه «تولید گروهی» در پنل انجام می‌دهد؛ اینجا فقط
 * برای بار اول و برای اجرای دسته‌ای روی سرور است. متنی که در پنل دستی نوشته
 * شده هرگز بازنویسی نمی‌شود.
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_TEMPLATES } from "../src/lib/seo-defaults.js";
import { renderTemplate } from "../src/lib/seo-content.js";
import {
  buildPartVars,
  buildModelVars,
  buildCarCategoryVars,
  buildCategoryVars,
  partVarsInclude,
} from "../src/lib/seo-vars.js";

const prisma = new PrismaClient();
const REFRESH = process.argv.includes("--refresh");
const SLOTS = ["metaTitle", "metaDescription", "h1", "intro", "body"] as const;

async function seedTemplates() {
  for (const seed of DEFAULT_TEMPLATES) {
    await prisma.contentTemplate.upsert({
      where: { key: seed.key },
      create: seed,
      update: { template: seed.template, nameFa: seed.nameFa, hintFa: seed.hintFa },
    });
  }
  console.log(`${DEFAULT_TEMPLATES.length} قالب آماده شد`);
}

type Vars = Record<string, string | number | null | undefined>;

async function generate(entityType: "PART" | "CAR_MODEL" | "CAR_CATEGORY" | "CATEGORY") {
  const templates = await prisma.contentTemplate.findMany({
    where: { entityType, isActive: true },
  });
  if (templates.length === 0) return;

  const existing = await prisma.seoContent.findMany({
    where: { entityType },
    select: { entityKey: true, isGenerated: true },
  });
  const seen = new Map(existing.map((e) => [e.entityKey, e.isGenerated]));

  // متن دستی هیچ‌وقت بازنویسی نمی‌شود
  const skip = (key: string) => {
    if (!seen.has(key)) return false;
    return REFRESH ? seen.get(key) === false : true;
  };

  const targets: Array<{ key: string; vars: Vars }> = [];

  if (entityType === "PART") {
    const parts = await prisma.part.findMany({
      where: { isActive: true },
      include: partVarsInclude,
    });
    for (const part of parts) {
      if (skip(part.id)) continue;
      targets.push({ key: part.id, vars: buildPartVars(part) });
    }
  } else if (entityType === "CAR_MODEL") {
    const models = await prisma.vehicleModel.findMany({ where: { isActive: true } });
    for (const m of models) {
      if (skip(m.id)) continue;
      targets.push({ key: m.id, vars: await buildModelVars(m.id) });
    }
  } else if (entityType === "CAR_CATEGORY") {
    for (const pair of await pairs()) {
      const key = `${pair.modelId}:${pair.categoryId}`;
      if (skip(key)) continue;
      targets.push({ key, vars: await buildCarCategoryVars(pair.modelId, pair.categoryId) });
    }
  } else {
    const cats = await prisma.partCategory.findMany({ where: { isActive: true } });
    for (const c of cats) {
      if (skip(c.id)) continue;
      targets.push({ key: c.id, vars: await buildCategoryVars(c.id) });
    }
  }

  let done = 0;
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
    if (++done % 500 === 0) console.log(`  … ${done} از ${targets.length}`);
  }
  console.log(`${entityType}: ${done} صفحه`);
}

/** ترکیب‌های دسته×خودرو که واقعاً قطعه دارند */
async function pairs() {
  const rows = await prisma.part.findMany({
    where: { isActive: true, fitments: { some: { generation: { isNot: null } } } },
    select: {
      categoryId: true,
      category: { select: { slug: true } },
      fitments: {
        select: { generation: { select: { model: { select: { id: true } } } } },
        take: 1,
      },
    },
  });
  const set = new Map<string, { modelId: string; categoryId: string }>();
  for (const row of rows) {
    const model = row.fitments[0]?.generation?.model;
    if (!model || row.category.slug === "uncategorized") continue;
    set.set(`${model.id}:${row.categoryId}`, {
      modelId: model.id,
      categoryId: row.categoryId,
    });
  }
  return [...set.values()];
}

async function main() {
  await seedTemplates();
  for (const type of ["CAR_MODEL", "CAR_CATEGORY", "CATEGORY", "PART"] as const) {
    await generate(type);
  }
  const total = await prisma.seoContent.count();
  console.log(`\n${total.toLocaleString("fa-IR")} صفحه محتوای سئو دارد`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
