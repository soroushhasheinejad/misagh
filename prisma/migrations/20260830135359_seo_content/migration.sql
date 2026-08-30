-- محتوای سئوی هر صفحه و قالب‌های تولید خودکار
CREATE TYPE "SeoEntity" AS ENUM ('PART', 'CAR_MODEL', 'CAR_CATEGORY', 'CATEGORY', 'PAGE');

CREATE TABLE "SeoContent" (
    "id" TEXT NOT NULL,
    "entityType" "SeoEntity" NOT NULL,
    "entityKey" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT,
    "intro" TEXT,
    "body" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeoContent_entityType_entityKey_key" ON "SeoContent"("entityType", "entityKey");
CREATE INDEX "SeoContent_entityType_idx" ON "SeoContent"("entityType");
CREATE INDEX "SeoContent_isGenerated_idx" ON "SeoContent"("isGenerated");

CREATE TABLE "ContentTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "hintFa" TEXT,
    "entityType" "SeoEntity" NOT NULL,
    "slot" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTemplate_key_key" ON "ContentTemplate"("key");
CREATE INDEX "ContentTemplate_entityType_slot_idx" ON "ContentTemplate"("entityType", "slot");
