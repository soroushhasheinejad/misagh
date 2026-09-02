-- کلیدواژه هدف، پرسش و پاسخ و تصویر اشتراک‌گذاری برای هر صفحه
ALTER TABLE "SeoContent" ADD COLUMN "targetKeyword" TEXT;
ALTER TABLE "SeoContent" ADD COLUMN "faq" JSONB;
ALTER TABLE "SeoContent" ADD COLUMN "ogImage" TEXT;

-- ریدایرکت قابل مدیریت از پنل
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "permanent" BOOLEAN NOT NULL DEFAULT true,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Redirect_source_key" ON "Redirect"("source");
CREATE INDEX "Redirect_isActive_idx" ON "Redirect"("isActive");
