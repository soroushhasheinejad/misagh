/**
 * فارسی‌سازی آدرس قطعات.
 *
 *   npx tsx scripts/seo-slugs.mts [--dry]
 *
 * چرا: آدرس فعلی /part/p-58101d3a00 هیچ کلمه فارسی ندارد، پس در جستجوی
 * «لنت جلو هیوندای اکسنت» هیچ سیگنالی به گوگل نمی‌دهد. الگوی سایت‌های موفق
 * این حوزه، آوردن نام قطعه به‌همراه برند و مدل خودرو در خود آدرس است.
 *
 * برای هر قطعه:
 *   عنوان سئو = نام قطعه + برند و مدل خودروی سازگار
 *   اسلاگ     = همان عنوان، با خط تیره
 *   اسلاگ قبلی در legacySlug می‌ماند تا آدرس‌های قدیمی ۳۰۱ بخورند.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

/** نویسه‌های فارسی و لاتین و رقم می‌مانند، بقیه خط تیره می‌شوند */
function slugify(input: string): string {
  return input
    .trim()
    .replace(/[‌‏‎]/g, " ") // نیم‌فاصله و نویسه‌های جهت
    .replace(/[^؀-ۿa-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** آیا نام قطعه از قبل نام خودرو را دارد؟ */
function mentions(name: string, word: string): boolean {
  if (!word) return true;
  return name.includes(word);
}

async function main() {
  const parts = await prisma.part.findMany({
    include: {
      numbers: { where: { isPrimary: true }, take: 1 },
      // سازگاری‌های ایمپورت‌شده به «نسل» وصل‌اند نه مستقیم به «مدل»،
      // پس برند و مدل باید از مسیر نسل خوانده شوند
      fitments: {
        include: {
          make: true,
          model: true,
          generation: { include: { model: { include: { make: true } } } },
        },
        take: 1,
      },
    },
  });

  console.log(`${parts.length.toLocaleString("fa-IR")} قطعه بررسی می‌شود`);

  const used = new Set<string>();
  const stats = { renamed: 0, unchanged: 0, withCar: 0, collisions: 0 };

  for (const part of parts) {
    const fit = part.fitments[0];
    const makeName = fit?.make?.nameFa ?? fit?.generation?.model.make.nameFa ?? "";
    const modelName = fit?.model?.nameFa ?? fit?.generation?.model.nameFa ?? "";

    // عنوان سئو: اگر نام قطعه خودرو را ندارد، اضافه شود
    const pieces = [part.nameFa];
    if (modelName && !mentions(part.nameFa, modelName)) {
      if (makeName && !mentions(part.nameFa, makeName)) pieces.push(makeName);
      pieces.push(modelName);
      stats.withCar++;
    }
    const titleFa = pieces.join(" ").replace(/\s+/g, " ").trim();

    let slug = slugify(titleFa);
    if (!slug) slug = `p-${part.numbers[0]?.number ?? part.id}`;

    // اگر دو قطعه به یک اسلاگ رسیدند، شماره فنی تفکیک‌کننده می‌شود
    if (used.has(slug)) {
      const number = part.numbers[0]?.number;
      slug = number ? `${slug}-${slugify(number)}` : `${slug}-${part.id.slice(-6)}`;
      stats.collisions++;
    }
    used.add(slug);

    if (slug === part.slug && part.titleFa === titleFa) {
      stats.unchanged++;
      continue;
    }

    stats.renamed++;
    if (!DRY) {
      await prisma.part.update({
        where: { id: part.id },
        data: {
          slug,
          titleFa,
          // اسلاگ قدیمی فقط بار اول ثبت می‌شود تا ریدایرکت‌های قبلی نشکنند
          legacySlug: part.legacySlug ?? part.slug,
        },
      });
    }

    if (stats.renamed <= 5) {
      console.log(`  ${part.slug}\n  → ${slug}`);
    }
  }

  console.log("\nنتیجه:");
  console.log(`  آدرس عوض شد:        ${stats.renamed.toLocaleString("fa-IR")}`);
  console.log(`  بدون تغییر:          ${stats.unchanged.toLocaleString("fa-IR")}`);
  console.log(`  نام خودرو اضافه شد:  ${stats.withCar.toLocaleString("fa-IR")}`);
  console.log(`  اسلاگ تکراری رفع شد: ${stats.collisions.toLocaleString("fa-IR")}`);
  if (DRY) console.log("\n(اجرای آزمایشی — چیزی ذخیره نشد)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
