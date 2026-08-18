-- CreateEnum
CREATE TYPE "public"."FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG');

-- CreateEnum
CREATE TYPE "public"."Transmission" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DCT');

-- CreateEnum
CREATE TYPE "public"."BodyType" AS ENUM ('SEDAN', 'HATCHBACK', 'SUV', 'CROSSOVER', 'VAN', 'PICKUP', 'COUPE', 'WAGON');

-- CreateEnum
CREATE TYPE "public"."DriveType" AS ENUM ('FWD', 'RWD', 'AWD');

-- CreateEnum
CREATE TYPE "public"."PartNumberType" AS ENUM ('OEM', 'SUPERSEDED', 'AFTERMARKET', 'INTERNAL');

-- CreateEnum
CREATE TYPE "public"."QualityTier" AS ENUM ('GENUINE', 'OEM_SUPPLIER', 'HIGH_COPY', 'AFTERMARKET', 'USED');

-- CreateEnum
CREATE TYPE "public"."FitPosition" AS ENUM ('UNIVERSAL', 'FRONT', 'REAR', 'LEFT', 'RIGHT', 'FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT', 'UPPER', 'LOWER');

-- CreateEnum
CREATE TYPE "public"."PriceMode" AS ENUM ('FIXED', 'CURRENCY_LINKED', 'INQUIRY', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."RoundingRule" AS ENUM ('NONE', 'NEAREST_1K', 'NEAREST_10K', 'NEAREST_100K', 'UP_10K', 'UP_100K');

-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "public"."InquiryChannel" AS ENUM ('SITE', 'TELEGRAM', 'WHATSAPP', 'PHONE');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER', 'WAREHOUSE', 'SUPPORT', 'CUSTOMER');

-- CreateTable
CREATE TABLE "public"."VehicleMake" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "logoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleModel" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleGeneration" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleTrim" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "engineCode" TEXT,
    "engineVolume" DECIMAL(4,1),
    "fuel" "public"."FuelType" NOT NULL DEFAULT 'PETROL',
    "transmission" "public"."Transmission",
    "bodyType" "public"."BodyType",
    "driveType" "public"."DriveType",
    "yearStart" INTEGER,
    "yearEnd" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleTrim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VinRule" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "wmi" TEXT NOT NULL,
    "pattern" TEXT,
    "modelHint" TEXT,
    "yearCharMap" JSONB,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VinRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartCategory" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "iconKey" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartBrand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "country" TEXT,
    "qualityTier" "public"."QualityTier" NOT NULL DEFAULT 'AFTERMARKET',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Part" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "description" TEXT,
    "specs" JSONB,
    "weightGram" INTEGER,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priceMode" "public"."PriceMode",
    "basePriceIrr" DECIMAL(18,2),
    "baseCurrencyCode" TEXT,
    "basePriceForeign" DECIMAL(18,4),
    "marginPercent" DECIMAL(6,2),
    "discountPercent" DECIMAL(6,2),
    "discountUntil" TIMESTAMP(3),
    "roundingRule" "public"."RoundingRule",
    "priceLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedPriceIrr" DECIMAL(18,2),
    "priceValidUntil" TIMESTAMP(3),
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "allowInquiry" BOOLEAN,
    "allowMultiOffer" BOOLEAN,
    "dealerMargin" DECIMAL(6,2),
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "computedPriceIrr" DECIMAL(18,2),
    "computedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartImage" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartNumber" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "brandId" TEXT,
    "number" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "type" "public"."PartNumberType" NOT NULL DEFAULT 'OEM',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrossGroup" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrossGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "partNumberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supersession" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supersession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fitment" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "makeId" TEXT,
    "modelId" TEXT,
    "generationId" TEXT,
    "trimId" TEXT,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "position" "public"."FitPosition" NOT NULL DEFAULT 'UNIVERSAL',
    "note" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "telegram" TEXT,
    "note" TEXT,
    "defaultLeadDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "supplierId" TEXT,
    "brandId" TEXT,
    "sku" TEXT,
    "status" "public"."OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 2,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "warehouseNote" TEXT,
    "priceMode" "public"."PriceMode",
    "basePriceIrr" DECIMAL(18,2),
    "baseCurrencyCode" TEXT,
    "basePriceForeign" DECIMAL(18,4),
    "costPriceIrr" DECIMAL(18,2),
    "marginPercent" DECIMAL(6,2),
    "discountPercent" DECIMAL(6,2),
    "discountUntil" TIMESTAMP(3),
    "roundingRule" "public"."RoundingRule",
    "priceLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedPriceIrr" DECIMAL(18,2),
    "priceValidUntil" TIMESTAMP(3),
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "allowInquiry" BOOLEAN,
    "dealerPriceIrr" DECIMAL(18,2),
    "minOrderQty" INTEGER,
    "computedPriceIrr" DECIMAL(18,2),
    "computedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Currency" (
    "code" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "rateIrr" DECIMAL(18,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."ExchangeRateHistory" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "oldRateIrr" DECIMAL(18,2) NOT NULL,
    "newRateIrr" DECIMAL(18,2) NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceHistory" (
    "id" TEXT NOT NULL,
    "partId" TEXT,
    "offerId" TEXT,
    "oldPriceIrr" DECIMAL(18,2),
    "newPriceIrr" DECIMAL(18,2),
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "labelFa" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isDealer" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generationId" TEXT,
    "trimId" TEXT,
    "nickname" TEXT,
    "vin" TEXT,
    "plate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "partId" TEXT,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "vehicleText" TEXT,
    "partText" TEXT,
    "partNumber" TEXT,
    "imageUrl" TEXT,
    "channel" "public"."InquiryChannel" NOT NULL DEFAULT 'SITE',
    "status" "public"."InquiryStatus" NOT NULL DEFAULT 'NEW',
    "quotedPrice" DECIMAL(18,2),
    "responseNote" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "lockedPrice" DECIMAL(18,2),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "line" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotalIrr" DECIMAL(18,2) NOT NULL,
    "discountIrr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "shippingIrr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalIrr" DECIMAL(18,2) NOT NULL,
    "shippingMethod" TEXT,
    "trackingCode" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "offerId" TEXT,
    "partId" TEXT,
    "titleFa" TEXT NOT NULL,
    "partNumber" TEXT,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "amountIrr" DECIMAL(18,2) NOT NULL,
    "authority" TEXT,
    "refId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "searchType" TEXT NOT NULL DEFAULT 'text',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "public"."VehicleMake"("slug");

-- CreateIndex
CREATE INDEX "VehicleModel_makeId_idx" ON "public"."VehicleModel"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_slug_key" ON "public"."VehicleModel"("makeId", "slug");

-- CreateIndex
CREATE INDEX "VehicleGeneration_modelId_idx" ON "public"."VehicleGeneration"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleGeneration_modelId_slug_key" ON "public"."VehicleGeneration"("modelId", "slug");

-- CreateIndex
CREATE INDEX "VehicleTrim_generationId_idx" ON "public"."VehicleTrim"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTrim_generationId_slug_key" ON "public"."VehicleTrim"("generationId", "slug");

-- CreateIndex
CREATE INDEX "VinRule_wmi_idx" ON "public"."VinRule"("wmi");

-- CreateIndex
CREATE UNIQUE INDEX "PartCategory_slug_key" ON "public"."PartCategory"("slug");

-- CreateIndex
CREATE INDEX "PartCategory_parentId_idx" ON "public"."PartCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "PartBrand_slug_key" ON "public"."PartBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Part_slug_key" ON "public"."Part"("slug");

-- CreateIndex
CREATE INDEX "Part_categoryId_idx" ON "public"."Part"("categoryId");

-- CreateIndex
CREATE INDEX "Part_brandId_idx" ON "public"."Part"("brandId");

-- CreateIndex
CREATE INDEX "Part_isActive_idx" ON "public"."Part"("isActive");

-- CreateIndex
CREATE INDEX "PartImage_partId_idx" ON "public"."PartImage"("partId");

-- CreateIndex
CREATE INDEX "PartNumber_normalized_idx" ON "public"."PartNumber"("normalized");

-- CreateIndex
CREATE INDEX "PartNumber_partId_idx" ON "public"."PartNumber"("partId");

-- CreateIndex
CREATE INDEX "CrossGroupMember_partNumberId_idx" ON "public"."CrossGroupMember"("partNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "CrossGroupMember_groupId_partNumberId_key" ON "public"."CrossGroupMember"("groupId", "partNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Supersession_fromId_toId_key" ON "public"."Supersession"("fromId", "toId");

-- CreateIndex
CREATE INDEX "Fitment_partId_idx" ON "public"."Fitment"("partId");

-- CreateIndex
CREATE INDEX "Fitment_generationId_idx" ON "public"."Fitment"("generationId");

-- CreateIndex
CREATE INDEX "Fitment_trimId_idx" ON "public"."Fitment"("trimId");

-- CreateIndex
CREATE INDEX "Fitment_modelId_idx" ON "public"."Fitment"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_sku_key" ON "public"."Offer"("sku");

-- CreateIndex
CREATE INDEX "Offer_partId_idx" ON "public"."Offer"("partId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "public"."Offer"("status");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_currencyCode_idx" ON "public"."ExchangeRateHistory"("currencyCode");

-- CreateIndex
CREATE INDEX "PriceHistory_partId_idx" ON "public"."PriceHistory"("partId");

-- CreateIndex
CREATE INDEX "PriceHistory_offerId_idx" ON "public"."PriceHistory"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "OtpCode_phone_idx" ON "public"."OtpCode"("phone");

-- CreateIndex
CREATE INDEX "UserVehicle_userId_idx" ON "public"."UserVehicle"("userId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "public"."Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_phone_idx" ON "public"."Inquiry"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_token_key" ON "public"."Cart"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_offerId_key" ON "public"."CartItem"("cartId", "offerId");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "public"."Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "public"."Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "SearchLog_normalized_idx" ON "public"."SearchLog"("normalized");

-- CreateIndex
CREATE INDEX "SearchLog_resultCount_idx" ON "public"."SearchLog"("resultCount");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "public"."VehicleModel" ADD CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleGeneration" ADD CONSTRAINT "VehicleGeneration_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."VehicleModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleTrim" ADD CONSTRAINT "VehicleTrim_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "public"."VehicleGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VinRule" ADD CONSTRAINT "VinRule_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartCategory" ADD CONSTRAINT "PartCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."PartCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Part" ADD CONSTRAINT "Part_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Part" ADD CONSTRAINT "Part_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."PartBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartImage" ADD CONSTRAINT "PartImage_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartNumber" ADD CONSTRAINT "PartNumber_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartNumber" ADD CONSTRAINT "PartNumber_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."PartBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrossGroupMember" ADD CONSTRAINT "CrossGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."CrossGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrossGroupMember" ADD CONSTRAINT "CrossGroupMember_partNumberId_fkey" FOREIGN KEY ("partNumberId") REFERENCES "public"."PartNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supersession" ADD CONSTRAINT "Supersession_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."PartNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Supersession" ADD CONSTRAINT "Supersession_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."PartNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fitment" ADD CONSTRAINT "Fitment_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fitment" ADD CONSTRAINT "Fitment_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."VehicleMake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fitment" ADD CONSTRAINT "Fitment_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fitment" ADD CONSTRAINT "Fitment_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "public"."VehicleGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fitment" ADD CONSTRAINT "Fitment_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "public"."VehicleTrim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."PartBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "public"."Currency"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceHistory" ADD CONSTRAINT "PriceHistory_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceHistory" ADD CONSTRAINT "PriceHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceHistory" ADD CONSTRAINT "PriceHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVehicle" ADD CONSTRAINT "UserVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVehicle" ADD CONSTRAINT "UserVehicle_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "public"."VehicleGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserVehicle" ADD CONSTRAINT "UserVehicle_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "public"."VehicleTrim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "public"."Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
