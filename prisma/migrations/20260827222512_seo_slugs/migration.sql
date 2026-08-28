-- افزودن اسلاگ قدیمی برای ریدایرکت ۳۰۱ و عنوان سئوی قطعه
ALTER TABLE "Part" ADD COLUMN "legacySlug" TEXT;
ALTER TABLE "Part" ADD COLUMN "titleFa" TEXT;
CREATE UNIQUE INDEX "Part_legacySlug_key" ON "Part"("legacySlug");
