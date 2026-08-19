/**
 * ایمپورت محصولات از خروجی نرم‌افزار انبار به دیتابیس.
 *
 *   npx tsx scripts/import-products.mts [مسیر فایل] [--dry]
 *
 * ورودی‌ها:
 *   ۱) فایل خام انبار (UTF-16 با جداکننده تب)
 *   ۲) data/vehicle-code-map.json — نقشه کد پروژه به خودرو، ساخته اسکریپت fix-vehicle-names.py
 *
 * قابل اجرای دوباره است: هر قطعه با شماره فنی‌اش upsert می‌شود، پس اجرای مجدد
 * داده تکراری نمی‌سازد و فقط تغییرات را اعمال می‌کند.
 */
import { readFileSync } from "node:fs";
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SRC = process.argv.find((a) => a.endsWith(".xls") || a.endsWith(".txt")) ??
  "/Users/sourosh/Downloads/CommodityNServiceProperty(2).xls";
const DRY = process.argv.includes("--dry");

type Vehicle = {
  make: "kia" | "hyundai";
  modelFa: string;
  modelEn: string;
  gen: string;
  genFa: string;
  yearStart: number;
  yearEnd: number | null;
};
type CodeEntry = {
  vehicle: Vehicle | null;
  siblings: Vehicle[];
  confidence: string;
  basis: string;
  partCount: number;
};

const codeMap: Record<string, CodeEntry> = JSON.parse(
  readFileSync("data/vehicle-code-map.json", "utf8"),
);

// ---------------------------------------------------------------------------
// خواندن فایل انبار
// ---------------------------------------------------------------------------
const COL = {
  partNumber: 1,
  name: 3,
  makeHint: 4,
  group: 5,
  vehicleLabel: 6,
  stock: 8,
  price: 13,
} as const;

const clean = (v: string | undefined) => (v ?? "").replace(/[\u0000-\u001f]/g, "").trim();

function readRows(path: string) {
  const text = readFileSync(path, "utf16le");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(1).map((l) => l.split("\t"));
}

function projectCode(partNumber: string) {
  const pn = partNumber.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  if (pn.length >= 7 && /^\d{5}$/.test(pn.slice(0, 5))) return { code: pn.slice(5, 7), pn };
  return { code: null, pn };
}

function toNumber(raw: string) {
  const n = Number(raw.replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// دسته‌بندی از روی نام قطعه — ستون «گروه محصول» فایل برای ۷۰٪ ردیف‌ها
// مقدار بی‌معنی «گروه 1» دارد، پس از خود نام قطعه استفاده می‌کنیم.
// ---------------------------------------------------------------------------
/** دسته‌هایی که در داده اولیه نبودند و از روی نام قطعات لازم شدند */
const EXTRA_CATEGORIES: Array<{ slug: string; nameFa: string; nameEn: string; parent?: string }> = [
  { slug: "cooling", nameFa: "خنک‌کاری", nameEn: "Cooling" },
  { slug: "radiator", nameFa: "رادیاتور", nameEn: "Radiator", parent: "cooling" },
  { slug: "coolant-hose", nameFa: "شیلنگ آب و بخاری", nameEn: "Coolant Hose", parent: "cooling" },
  { slug: "heater-core", nameFa: "رادیاتور بخاری", nameEn: "Heater Core", parent: "cooling" },

  { slug: "steering", nameFa: "فرمان", nameEn: "Steering" },
  { slug: "steering-gear", nameFa: "جعبه فرمان", nameEn: "Steering Gear", parent: "steering" },
  { slug: "steering-pump", nameFa: "پمپ هیدرولیک", nameEn: "Power Steering Pump", parent: "steering" },
  { slug: "knuckle", nameFa: "سگدست و توپی چرخ", nameEn: "Knuckle & Hub", parent: "steering" },

  { slug: "engine-mount", nameFa: "دسته موتور", nameEn: "Engine Mount", parent: "engine" },
  { slug: "engine-internal", nameFa: "پیستون، شاتون و یاتاقان", nameEn: "Engine Internals", parent: "engine" },
  { slug: "valve-cover", nameFa: "درب سوپاپ و واشرآلات", nameEn: "Valve Cover & Gaskets", parent: "engine" },
  { slug: "fuel-pump", nameFa: "پمپ بنزین", nameEn: "Fuel Pump", parent: "engine" },
  { slug: "exhaust", nameFa: "اگزوز", nameEn: "Exhaust", parent: "engine" },
  { slug: "oil-seal", nameFa: "کاسه نمد", nameEn: "Oil Seal", parent: "engine" },

  { slug: "brake-master", nameFa: "پمپ و بوستر ترمز", nameEn: "Brake Master", parent: "brakes" },
  { slug: "brake-hose", nameFa: "شیلنگ و سیم ترمز", nameEn: "Brake Hose & Cable", parent: "brakes" },

  { slug: "sensor", nameFa: "سنسورها", nameEn: "Sensors", parent: "electrical" },
  { slug: "switch", nameFa: "کلید و سوییچ", nameEn: "Switches", parent: "electrical" },
  { slug: "tail-light", nameFa: "چراغ خطر عقب", nameEn: "Tail Light", parent: "electrical" },

  { slug: "grille", nameFa: "جلو پنجره", nameEn: "Grille", parent: "body" },
  { slug: "fender-liner", nameFa: "شلگیر و گلگیر", nameEn: "Fender Liner", parent: "body" },
  { slug: "door-lock", nameFa: "قفل و دستگیره", nameEn: "Lock & Handle", parent: "body" },
  { slug: "undercover", nameFa: "سینی زیر و بادگیر", nameEn: "Undercover", parent: "body" },
  { slug: "side-step", nameFa: "رکاب", nameEn: "Side Step", parent: "body" },
  { slug: "interior-trim", nameFa: "داشبورد و تزیینات داخلی", nameEn: "Interior Trim", parent: "body" },
  { slug: "washer-tank", nameFa: "مخزن شیشه‌شور", nameEn: "Washer Tank", parent: "body" },

  { slug: "driveshaft", nameFa: "پلوس و چهارشاخ", nameEn: "Driveshaft", parent: "engine" },
];

const CATEGORY_RULES: Array<[string, RegExp]> = [
  ["brake-pads-front", /لنت\s*(ترمز\s*)?جلو/],
  ["brake-pads-rear", /لنت\s*(ترمز\s*)?عقب/],
  ["brake-pads-front", /^لنت/],
  ["brake-disc", /دیسک|کاسه\s*ترمز/],
  ["brake-caliper", /کالیپر|سیلندر\s*ترمز/],
  ["brake-master", /پمپ\s*ترمز|بوستر/],
  ["brake-hose", /(شیلنگ|شلنگ|سیم)\s*ترمز|ترمز\s*دستی/],
  ["oil-filter", /فیلتر\s*روغن|صافی\s*روغن/],
  ["air-filter", /فیلتر\s*هوا|صافی\s*هوا/],
  ["cabin-filter", /فیلتر\s*کابین|فیلتر\s*اتاق/],
  ["fuel-filter", /فیلتر\s*(بنزین|سوخت)/],
  ["timing-belt", /تسمه/],
  ["water-pump", /واتر\s*پمپ|پمپ\s*آب/],
  ["spark-plug", /شمع/],
  ["head-gasket", /واشر\s*سرسیلندر|واشر\s*سر\s*سیلندر/],
  ["shock-absorber", /کمک\s*فنر|کمک/],
  ["control-arm", /طبق|بازویی/],
  ["ball-joint", /سیبک/],
  ["stabilizer-link", /موج\s*گیر|موج‌گیر|میل\s*تعادل/],
  ["battery", /باتری/],
  ["alternator", /دینام|آلترناتور/],
  ["headlight", /چراغ\s*جلو|پروژکتور|چراغ\s*مه/],
  ["bumper", /سپر|براکت\s*سپر/],
  ["mirror", /آینه/],
  ["wiper-blade", /برف\s*پاک|تیغه/],
  ["engine-oil", /روغن\s*موتور/],
  ["gear-oil", /روغن\s*(گیربکس|هیدرولیک)/],
  ["coolant", /ضدیخ|ضد\s*یخ/],

  // موتور و متعلقات
  ["engine-mount", /دسته\s*موتور|بوش\s*رام|رام\s*موتور/],
  ["engine-internal", /پیستون|شاتون|ر(ی|ي)نگ\s*موتور|(ی|ي)اتاقان|م(ی|ي)ل\s*لنگ|سوپاپ(?!\s*درب)/],
  ["valve-cover", /درب\s*سوپاپ|واشر/],
  ["fuel-pump", /پمپ\s*(سوخت|بنز(ی|ي)ن)|انژکتور|باک/],
  ["exhaust", /اگزوز|منبع\s*اگزوز|کاتال(ی|ي)ست/],
  ["oil-seal", /کاسه\s*نمد|اورینگ|او\s*ر(ی|ي)نگ/],
  ["driveshaft", /پلوس|چهار\s*شاخ|چهارشاخ|گاردان/],

  // خنک‌کاری
  ["heater-core", /رادیاتور\s*بخاری|راد(ی|ي)اتور\s*بخار/],
  ["radiator", /راد(ی|ي)اتور|فن\s*راد|کندانسور/],
  ["coolant-hose", /ش(ی|ي)?لنگ\s*(بخاری|آب|بالا|پائ(ی|ي)ن|پا(ی|ي)(ی|ي)ن)/],

  // فرمان و جلوبندی
  ["steering-gear", /جعبه\s*فرمان|قرقری\s*فرمان|م(ی|ي)ل\s*فرمان/],
  ["steering-pump", /پمپ\s*ه(ی|ي)درول(ی|ي)ک|جک\s*فرمان/],
  ["knuckle", /سگدست|توپ(ی|ي)\s*چرخ|بلبر(ی|ي)نگ\s*چرخ/],

  // برق
  ["sensor", /سنسور|سن\s*سور/],
  ["switch", /کل(ی|ي)د\s|فنر\s*ساعت(ی|ي)|سو(ی|ي)چ|رله/],
  ["tail-light", /چراغ\s*عقب|خطر\s*عقب|چراغ\s*ترمز/],

  // بدنه
  ["grille", /جلو\s*پنجره|جلوپنجره/],
  ["fender-liner", /شلگ(ی|ي)ر|گلگ(ی|ي)ر|گل\s*پخش|گلپخش/],
  ["door-lock", /قفل|دستگ(ی|ي)ره|مکان(ی|ي)زم/],
  ["undercover", /س(ی|ي)ن(ی|ي)\s*ز(ی|ي)ر|بادگ(ی|ي)ر|حص(ی|ي)ر(ی|ي)/],
  ["side-step", /رکاب/],
  ["washer-tank", /مخزن\s*ش(ی|ي)شه|شیشه\s*شو/],
  ["interior-trim", /داشبورد|کنسول|روکش|تودری|زه\s/],
];

const GROUP_FALLBACK: Record<string, string> = {
  "قطعات جلوبندی": "suspension",
  "قطعات عقب بندی": "suspension",
  "قطعات موتوری": "engine",
  "قطعات بدنه": "body",
  "قطعات برقی": "electrical",
  "قطعات داخلی خودرو": "body",
  "قطعات اتاق خودرو": "filters",
  "قطعات انتقال نیرو و گیربکس": "engine",
};

function categorySlug(name: string, group: string) {
  for (const [slug, re] of CATEGORY_RULES) if (re.test(name)) return slug;
  return GROUP_FALLBACK[group] ?? "uncategorized";
}

function slugify(pn: string) {
  return `p-${pn.toLowerCase()}`;
}

function formatPartNumber(pn: string) {
  return /^\d{5}[0-9A-Z]{4,}$/.test(pn) ? `${pn.slice(0, 5)}-${pn.slice(5)}` : pn;
}

// ---------------------------------------------------------------------------
// ساخت درخت خودرو از نقشه کدها
// ---------------------------------------------------------------------------
const generationCache = new Map<string, string>();

async function ensureGeneration(v: Vehicle): Promise<string> {
  const key = `${v.make}/${v.modelEn}/${v.gen}`;
  const cached = generationCache.get(key);
  if (cached) return cached;

  const make = await prisma.vehicleMake.upsert({
    where: { slug: v.make },
    create: {
      slug: v.make,
      nameFa: v.make === "kia" ? "کیا" : "هیوندای",
      nameEn: v.make === "kia" ? "Kia" : "Hyundai",
    },
    update: {},
  });

  const modelSlug = v.modelEn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const model = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: make.id, slug: modelSlug } },
    create: { makeId: make.id, slug: modelSlug, nameFa: v.modelFa, nameEn: v.modelEn },
    update: {},
  });

  const genSlug = v.gen.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "base";
  const generation = await prisma.vehicleGeneration.upsert({
    where: { modelId_slug: { modelId: model.id, slug: genSlug } },
    create: {
      modelId: model.id,
      slug: genSlug,
      nameFa: v.genFa,
      nameEn: v.gen,
      code: v.gen,
      yearStart: v.yearStart,
      yearEnd: v.yearEnd,
    },
    update: {},
  });

  generationCache.set(key, generation.id);
  return generation.id;
}

// ---------------------------------------------------------------------------
async function main() {
  const rows = readRows(SRC);
  console.log(`فایل: ${rows.length.toLocaleString("fa-IR")} ردیف`);

  // دسته‌بندی «متفرقه» برای قطعاتی که قاعده‌ای نداشتند
  await prisma.partCategory.upsert({
    where: { slug: "uncategorized" },
    create: { slug: "uncategorized", nameFa: "دسته‌بندی‌نشده", nameEn: "Uncategorized", sortOrder: 99 },
    update: {},
  });

  // دسته‌های تکمیلی — اول والدها بعد فرزندها
  for (const c of EXTRA_CATEGORIES.filter((c) => !c.parent)) {
    await prisma.partCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, nameFa: c.nameFa, nameEn: c.nameEn },
      update: {},
    });
  }
  for (const c of EXTRA_CATEGORIES.filter((c) => c.parent)) {
    const parent = await prisma.partCategory.findUnique({ where: { slug: c.parent! } });
    await prisma.partCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, nameFa: c.nameFa, nameEn: c.nameEn, parentId: parent?.id },
      update: { parentId: parent?.id },
    });
  }

  const categories = await prisma.partCategory.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-main-warehouse" },
    create: { id: "seed-main-warehouse", name: "انبار مرکزی", defaultLeadDays: 0 },
    update: {},
  });

  const stats = {
    imported: 0,
    updated: 0,
    withFitment: 0,
    withPrice: 0,
    inquiryOnly: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    siblingFitments: 0,
  };

  const seen = new Set<string>();

  for (const r of rows) {
    const pnRaw = clean(r[COL.partNumber]);
    const name = clean(r[COL.name]);
    if (!pnRaw || !name) {
      stats.skippedInvalid++;
      continue;
    }

    const { code, pn } = projectCode(pnRaw);
    if (pn.length < 5) {
      stats.skippedInvalid++;
      continue;
    }
    if (seen.has(pn)) {
      stats.skippedDuplicate++;
      continue;
    }
    seen.add(pn);

    const group = clean(r[COL.group]);
    const catSlug = categorySlug(name, group);
    const categoryId = catBySlug.get(catSlug) ?? catBySlug.get("uncategorized")!;

    const priceIrr = toNumber(clean(r[COL.price]));
    const stockQty = Math.max(0, Math.trunc(toNumber(clean(r[COL.stock]))));
    const entry = code ? codeMap[code] : undefined;
    const vehicle = entry?.vehicle ?? null;

    if (DRY) {
      stats.imported++;
      if (vehicle) stats.withFitment++;
      if (priceIrr > 0) stats.withPrice++;
      else stats.inquiryOnly++;
      continue;
    }

    const partData: Prisma.PartUncheckedCreateInput = {
      slug: slugify(pn),
      nameFa: name,
      categoryId,
      // قیمت فایل انبار قیمت فروش نهایی است، پس حاشیه سود روی آن اعمال نمی‌شود
      priceMode: priceIrr > 0 ? "FIXED" : "INQUIRY",
      marginPercent: 0,
      allowInquiry: true,
      specs: {
        منبع: "ایمپورت اکسل انبار",
        کدپروژه: code ?? "",
        اطمینان_خودرو: entry?.confidence ?? "نامشخص",
      },
    };

    const existing = await prisma.part.findUnique({ where: { slug: partData.slug } });
    const part = existing
      ? await prisma.part.update({
          where: { id: existing.id },
          data: { nameFa: name, categoryId, priceMode: partData.priceMode },
        })
      : await prisma.part.create({ data: partData });

    existing ? stats.updated++ : stats.imported++;

    // شماره فنی
    const numbers = await prisma.partNumber.findMany({ where: { partId: part.id } });
    if (!numbers.some((n) => n.normalized === pn)) {
      await prisma.partNumber.create({
        data: {
          partId: part.id,
          number: formatPartNumber(pn),
          normalized: pn,
          type: "OEM",
          isPrimary: true,
        },
      });
    }

    // پیشنهاد فروش پیش‌فرض
    const sku = `WH-${pn}`;
    const offer = await prisma.offer.findUnique({ where: { sku } });
    const offerData = {
      partId: part.id,
      supplierId: supplier.id,
      sku,
      isDefault: true,
      stockQty,
      leadTimeDays: stockQty > 0 ? 0 : 3,
      status: stockQty > 0 ? ("ACTIVE" as const) : ("OUT_OF_STOCK" as const),
      priceMode: priceIrr > 0 ? ("FIXED" as const) : ("INQUIRY" as const),
      basePriceIrr: priceIrr > 0 ? priceIrr : null,
      marginPercent: 0,
    };
    if (offer) {
      await prisma.offer.update({ where: { id: offer.id }, data: offerData });
    } else {
      await prisma.offer.create({ data: offerData });
    }
    priceIrr > 0 ? stats.withPrice++ : stats.inquiryOnly++;

    // سازگاری با خودرو
    if (vehicle) {
      const generationId = await ensureGeneration(vehicle);
      const already = await prisma.fitment.findFirst({ where: { partId: part.id, generationId } });
      if (!already) {
        await prisma.fitment.create({
          data: {
            partId: part.id,
            generationId,
            position: "UNIVERSAL",
            verified: entry?.confidence === "بالا",
            note: entry?.confidence === "بالا" ? null : `اطمینان: ${entry?.confidence ?? "نامشخص"}`,
          },
        });
      }
      stats.withFitment++;

      for (const sib of entry?.siblings ?? []) {
        const sibGenId = await ensureGeneration(sib);
        const exists = await prisma.fitment.findFirst({
          where: { partId: part.id, generationId: sibGenId },
        });
        if (!exists) {
          await prisma.fitment.create({
            data: {
              partId: part.id,
              generationId: sibGenId,
              position: "UNIVERSAL",
              verified: false,
              note: "هم‌سکو — نیاز به تایید",
            },
          });
          stats.siblingFitments++;
        }
      }
    }

    if ((stats.imported + stats.updated) % 500 === 0) {
      console.log(`  … ${(stats.imported + stats.updated).toLocaleString("fa-IR")} قطعه`);
    }
  }

  console.log("\nنتیجه:");
  console.log(`  قطعه جدید:            ${stats.imported.toLocaleString("fa-IR")}`);
  console.log(`  قطعه به‌روزشده:        ${stats.updated.toLocaleString("fa-IR")}`);
  console.log(`  با خودروی سازگار:      ${stats.withFitment.toLocaleString("fa-IR")}`);
  console.log(`  سازگاری هم‌سکو:        ${stats.siblingFitments.toLocaleString("fa-IR")}`);
  console.log(`  با قیمت:              ${stats.withPrice.toLocaleString("fa-IR")}`);
  console.log(`  فقط استعلام:           ${stats.inquiryOnly.toLocaleString("fa-IR")}`);
  console.log(`  کد تکراری (رد شد):     ${stats.skippedDuplicate.toLocaleString("fa-IR")}`);
  console.log(`  ردیف نامعتبر:          ${stats.skippedInvalid.toLocaleString("fa-IR")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
