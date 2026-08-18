/**
 * داده اولیه: خودروهای پرتیراژ کیا و هیوندا در بازار ایران، درخت دسته‌بندی،
 * برندهای قطعه، ارزها، و چند قطعه نمونه که هر سه حالت قیمت‌گذاری را نشان می‌دهد.
 *
 * اجرا: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pn(number: string) {
  return { number, normalized: number.replace(/[^0-9A-Za-z]/g, "").toUpperCase() };
}

async function main() {
  console.log("→ پاک‌سازی داده قبلی");
  await prisma.crossGroupMember.deleteMany();
  await prisma.crossGroup.deleteMany();
  await prisma.supersession.deleteMany();
  await prisma.partNumber.deleteMany();
  await prisma.fitment.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.partImage.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partCategory.deleteMany();
  await prisma.partBrand.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.vehicleTrim.deleteMany();
  await prisma.vehicleGeneration.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vinRule.deleteMany();
  await prisma.vehicleMake.deleteMany();
  await prisma.currency.deleteMany();

  // ----------------------------- ارز ---------------------------------------
  console.log("→ ارزها");
  await prisma.currency.createMany({
    data: [
      // نرخ‌ها به ریال و صرفاً مقدار اولیه‌اند؛ از پنل مدیریت به‌روز می‌شوند.
      { code: "USD", nameFa: "دلار آمریکا", rateIrr: 1_200_000, isDefault: true },
      { code: "AED", nameFa: "درهم امارات", rateIrr: 327_000 },
      { code: "EUR", nameFa: "یورو", rateIrr: 1_300_000 },
      { code: "CNY", nameFa: "یوان چین", rateIrr: 168_000 },
    ],
  });

  // ---------------------------- خودروها -------------------------------------
  console.log("→ کاتالوگ خودرو");
  const kia = await prisma.vehicleMake.create({
    data: { slug: "kia", nameFa: "کیا", nameEn: "Kia", sortOrder: 1 },
  });
  const hyundai = await prisma.vehicleMake.create({
    data: { slug: "hyundai", nameFa: "هیوندای", nameEn: "Hyundai", sortOrder: 2 },
  });

  type TrimSeed = {
    slug: string;
    nameFa: string;
    nameEn: string;
    engineCode?: string;
    engineVolume?: number;
    transmission?: "MANUAL" | "AUTOMATIC" | "CVT" | "DCT";
    bodyType?: "SEDAN" | "HATCHBACK" | "SUV" | "CROSSOVER" | "VAN" | "PICKUP" | "COUPE" | "WAGON";
  };
  type GenSeed = {
    slug: string;
    nameFa: string;
    nameEn: string;
    code?: string;
    yearStart: number;
    yearEnd?: number;
    trims: TrimSeed[];
  };
  type ModelSeed = { slug: string; nameFa: string; nameEn: string; generations: GenSeed[] };

  const kiaModels: ModelSeed[] = [
    {
      slug: "sportage",
      nameFa: "اسپورتیج",
      nameEn: "Sportage",
      generations: [
        {
          slug: "ql",
          nameFa: "نسل چهارم",
          nameEn: "4th gen",
          code: "QL",
          yearStart: 2016,
          yearEnd: 2021,
          trims: [
            { slug: "2-0-gdi", nameFa: "۲.۰ بنزینی", nameEn: "2.0 GDI", engineCode: "G4NA", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KE", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
          ],
        },
        {
          slug: "nq5",
          nameFa: "نسل پنجم",
          nameEn: "5th gen",
          code: "NQ5",
          yearStart: 2022,
          trims: [
            { slug: "2-0-mpi", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NL", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
          ],
        },
      ],
    },
    {
      slug: "cerato",
      nameFa: "سراتو",
      nameEn: "Cerato",
      generations: [
        {
          slug: "yd",
          nameFa: "نسل دوم",
          nameEn: "2nd gen",
          code: "YD",
          yearStart: 2013,
          yearEnd: 2018,
          trims: [
            { slug: "1-6", nameFa: "۱.۶ بنزینی", nameEn: "1.6 MPI", engineCode: "G4FG", engineVolume: 1.6, transmission: "AUTOMATIC", bodyType: "SEDAN" },
            { slug: "2-0", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NA", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
        {
          slug: "bd",
          nameFa: "نسل سوم",
          nameEn: "3rd gen",
          code: "BD",
          yearStart: 2019,
          trims: [
            { slug: "2-0", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NA", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
      ],
    },
    {
      slug: "optima",
      nameFa: "اپتیما",
      nameEn: "Optima",
      generations: [
        {
          slug: "jf",
          nameFa: "نسل چهارم",
          nameEn: "4th gen",
          code: "JF",
          yearStart: 2016,
          yearEnd: 2020,
          trims: [
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KJ", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
      ],
    },
    {
      slug: "picanto",
      nameFa: "پیکانتو",
      nameEn: "Picanto",
      generations: [
        {
          slug: "ja",
          nameFa: "نسل سوم",
          nameEn: "3rd gen",
          code: "JA",
          yearStart: 2017,
          trims: [
            { slug: "1-2", nameFa: "۱.۲ بنزینی", nameEn: "1.2 MPI", engineCode: "G4LA", engineVolume: 1.2, transmission: "AUTOMATIC", bodyType: "HATCHBACK" },
          ],
        },
      ],
    },
    {
      slug: "sorento",
      nameFa: "سورنتو",
      nameEn: "Sorento",
      generations: [
        {
          slug: "um",
          nameFa: "نسل سوم",
          nameEn: "3rd gen",
          code: "UM",
          yearStart: 2015,
          yearEnd: 2020,
          trims: [
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KE", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "SUV" },
          ],
        },
      ],
    },
  ];

  const hyundaiModels: ModelSeed[] = [
    {
      slug: "tucson",
      nameFa: "توسان",
      nameEn: "Tucson",
      generations: [
        {
          slug: "tl",
          nameFa: "نسل سوم",
          nameEn: "3rd gen",
          code: "TL",
          yearStart: 2016,
          yearEnd: 2020,
          trims: [
            { slug: "2-0-mpi", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NA", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KE", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
          ],
        },
        {
          slug: "nx4",
          nameFa: "نسل چهارم",
          nameEn: "4th gen",
          code: "NX4",
          yearStart: 2021,
          trims: [
            { slug: "2-0", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NL", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "CROSSOVER" },
          ],
        },
      ],
    },
    {
      slug: "elantra",
      nameFa: "النترا",
      nameEn: "Elantra",
      generations: [
        {
          slug: "ad",
          nameFa: "نسل ششم",
          nameEn: "6th gen",
          code: "AD",
          yearStart: 2016,
          yearEnd: 2020,
          trims: [
            { slug: "2-0", nameFa: "۲.۰ بنزینی", nameEn: "2.0 MPI", engineCode: "G4NA", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "SEDAN" },
            { slug: "1-6", nameFa: "۱.۶ بنزینی", nameEn: "1.6 MPI", engineCode: "G4FG", engineVolume: 1.6, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
      ],
    },
    {
      slug: "sonata",
      nameFa: "سوناتا",
      nameEn: "Sonata",
      generations: [
        {
          slug: "lf",
          nameFa: "نسل هفتم",
          nameEn: "7th gen",
          code: "LF",
          yearStart: 2015,
          yearEnd: 2019,
          trims: [
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KJ", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "SEDAN" },
            { slug: "hybrid", nameFa: "هیبرید", nameEn: "Hybrid", engineCode: "G4NG", engineVolume: 2.0, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
      ],
    },
    {
      slug: "santafe",
      nameFa: "سانتافه",
      nameEn: "Santa Fe",
      generations: [
        {
          slug: "dm",
          nameFa: "نسل سوم",
          nameEn: "3rd gen",
          code: "DM",
          yearStart: 2013,
          yearEnd: 2018,
          trims: [
            { slug: "2-4-gdi", nameFa: "۲.۴ بنزینی", nameEn: "2.4 GDI", engineCode: "G4KE", engineVolume: 2.4, transmission: "AUTOMATIC", bodyType: "SUV" },
          ],
        },
      ],
    },
    {
      slug: "accent",
      nameFa: "اکسنت",
      nameEn: "Accent",
      generations: [
        {
          slug: "rb",
          nameFa: "نسل چهارم",
          nameEn: "4th gen",
          code: "RB",
          yearStart: 2011,
          yearEnd: 2019,
          trims: [
            { slug: "1-6", nameFa: "۱.۶ بنزینی", nameEn: "1.6 MPI", engineCode: "G4FC", engineVolume: 1.6, transmission: "AUTOMATIC", bodyType: "SEDAN" },
          ],
        },
      ],
    },
    {
      slug: "i20",
      nameFa: "آی۲۰",
      nameEn: "i20",
      generations: [
        {
          slug: "gb",
          nameFa: "نسل دوم",
          nameEn: "2nd gen",
          code: "GB",
          yearStart: 2015,
          yearEnd: 2020,
          trims: [
            { slug: "1-4", nameFa: "۱.۴ بنزینی", nameEn: "1.4 MPI", engineCode: "G4LC", engineVolume: 1.4, transmission: "AUTOMATIC", bodyType: "HATCHBACK" },
          ],
        },
      ],
    },
  ];

  const trimIds: Record<string, string> = {};
  const genIds: Record<string, string> = {};

  for (const [make, models] of [
    [kia, kiaModels],
    [hyundai, hyundaiModels],
  ] as const) {
    for (const [i, m] of models.entries()) {
      const model = await prisma.vehicleModel.create({
        data: { makeId: make.id, slug: m.slug, nameFa: m.nameFa, nameEn: m.nameEn, sortOrder: i },
      });
      for (const g of m.generations) {
        const gen = await prisma.vehicleGeneration.create({
          data: {
            modelId: model.id,
            slug: g.slug,
            nameFa: g.nameFa,
            nameEn: g.nameEn,
            code: g.code,
            yearStart: g.yearStart,
            yearEnd: g.yearEnd,
          },
        });
        genIds[`${m.slug}/${g.slug}`] = gen.id;
        for (const t of g.trims) {
          const trim = await prisma.vehicleTrim.create({
            data: {
              generationId: gen.id,
              slug: t.slug,
              nameFa: t.nameFa,
              nameEn: t.nameEn,
              engineCode: t.engineCode,
              engineVolume: t.engineVolume,
              transmission: t.transmission,
              bodyType: t.bodyType,
              yearStart: g.yearStart,
              yearEnd: g.yearEnd,
            },
          });
          trimIds[`${m.slug}/${g.slug}/${t.slug}`] = trim.id;
        }
      }
    }
  }

  // قواعد VIN
  await prisma.vinRule.createMany({
    data: [
      { makeId: kia.id, wmi: "KNA", note: "کیا — کره جنوبی" },
      { makeId: kia.id, wmi: "KNB", note: "کیا — کره جنوبی" },
      { makeId: kia.id, wmi: "KND", note: "کیا — شاسی‌بلند" },
      { makeId: kia.id, wmi: "U5Y", note: "کیا — اسلواکی" },
      { makeId: hyundai.id, wmi: "KMH", note: "هیوندای — کره جنوبی" },
      { makeId: hyundai.id, wmi: "KM8", note: "هیوندای — شاسی‌بلند" },
      { makeId: hyundai.id, wmi: "TMA", note: "هیوندای — چک" },
      { makeId: hyundai.id, wmi: "NLH", note: "هیوندای — ترکیه" },
    ],
  });

  // --------------------------- دسته‌بندی ------------------------------------
  console.log("→ دسته‌بندی قطعات");
  const categoryTree: Array<{ slug: string; nameFa: string; nameEn: string; children: Array<{ slug: string; nameFa: string; nameEn: string }> }> = [
    {
      slug: "brakes", nameFa: "ترمز", nameEn: "Brakes",
      children: [
        { slug: "brake-pads-front", nameFa: "لنت ترمز جلو", nameEn: "Front Brake Pads" },
        { slug: "brake-pads-rear", nameFa: "لنت ترمز عقب", nameEn: "Rear Brake Pads" },
        { slug: "brake-disc", nameFa: "دیسک ترمز", nameEn: "Brake Disc" },
        { slug: "brake-caliper", nameFa: "کالیپر", nameEn: "Caliper" },
      ],
    },
    {
      slug: "filters", nameFa: "فیلترها", nameEn: "Filters",
      children: [
        { slug: "oil-filter", nameFa: "فیلتر روغن", nameEn: "Oil Filter" },
        { slug: "air-filter", nameFa: "فیلتر هوا", nameEn: "Air Filter" },
        { slug: "cabin-filter", nameFa: "فیلتر کابین", nameEn: "Cabin Filter" },
        { slug: "fuel-filter", nameFa: "فیلتر بنزین", nameEn: "Fuel Filter" },
      ],
    },
    {
      slug: "engine", nameFa: "موتور", nameEn: "Engine",
      children: [
        { slug: "timing-belt", nameFa: "تسمه تایم", nameEn: "Timing Belt" },
        { slug: "water-pump", nameFa: "واتر پمپ", nameEn: "Water Pump" },
        { slug: "spark-plug", nameFa: "شمع", nameEn: "Spark Plug" },
        { slug: "head-gasket", nameFa: "واشر سرسیلندر", nameEn: "Head Gasket" },
      ],
    },
    {
      slug: "suspension", nameFa: "جلوبندی و تعلیق", nameEn: "Suspension",
      children: [
        { slug: "shock-absorber", nameFa: "کمک فنر", nameEn: "Shock Absorber" },
        { slug: "control-arm", nameFa: "طبق", nameEn: "Control Arm" },
        { slug: "ball-joint", nameFa: "سیبک", nameEn: "Ball Joint" },
        { slug: "stabilizer-link", nameFa: "میل موج‌گیر", nameEn: "Stabilizer Link" },
      ],
    },
    {
      slug: "electrical", nameFa: "برق و روشنایی", nameEn: "Electrical",
      children: [
        { slug: "battery", nameFa: "باتری", nameEn: "Battery" },
        { slug: "alternator", nameFa: "دینام", nameEn: "Alternator" },
        { slug: "headlight", nameFa: "چراغ جلو", nameEn: "Headlight" },
      ],
    },
    {
      slug: "body", nameFa: "بدنه", nameEn: "Body",
      children: [
        { slug: "bumper", nameFa: "سپر", nameEn: "Bumper" },
        { slug: "mirror", nameFa: "آینه", nameEn: "Mirror" },
        { slug: "wiper-blade", nameFa: "تیغه برف‌پاک‌کن", nameEn: "Wiper Blade" },
      ],
    },
    {
      slug: "lubricants", nameFa: "روغن و روانکار", nameEn: "Lubricants",
      children: [
        { slug: "engine-oil", nameFa: "روغن موتور", nameEn: "Engine Oil" },
        { slug: "gear-oil", nameFa: "روغن گیربکس", nameEn: "Gear Oil" },
        { slug: "coolant", nameFa: "ضدیخ", nameEn: "Coolant" },
      ],
    },
  ];

  const catIds: Record<string, string> = {};
  for (const [i, c] of categoryTree.entries()) {
    const parent = await prisma.partCategory.create({
      data: { slug: c.slug, nameFa: c.nameFa, nameEn: c.nameEn, sortOrder: i },
    });
    catIds[c.slug] = parent.id;
    for (const [j, ch] of c.children.entries()) {
      const child = await prisma.partCategory.create({
        data: { slug: ch.slug, nameFa: ch.nameFa, nameEn: ch.nameEn, parentId: parent.id, sortOrder: j },
      });
      catIds[ch.slug] = child.id;
    }
  }

  // --------------------------- برند قطعه ------------------------------------
  console.log("→ برندهای قطعه");
  const brandSeed = [
    { slug: "mobis", nameFa: "موبیس", nameEn: "MOBIS", country: "کره جنوبی", qualityTier: "GENUINE" as const },
    { slug: "hyundai-genuine", nameFa: "هیوندای جنیون", nameEn: "Hyundai Genuine", country: "کره جنوبی", qualityTier: "GENUINE" as const },
    { slug: "kia-genuine", nameFa: "کیا جنیون", nameEn: "Kia Genuine", country: "کره جنوبی", qualityTier: "GENUINE" as const },
    { slug: "hi-q", nameFa: "های‌کیو", nameEn: "HI-Q", country: "کره جنوبی", qualityTier: "OEM_SUPPLIER" as const },
    { slug: "sangsin", nameFa: "سانگ‌سین", nameEn: "Sangsin", country: "کره جنوبی", qualityTier: "OEM_SUPPLIER" as const },
    { slug: "phc-valeo", nameFa: "پی‌اچ‌سی والئو", nameEn: "PHC Valeo", country: "کره جنوبی", qualityTier: "OEM_SUPPLIER" as const },
    { slug: "mando", nameFa: "ماندو", nameEn: "Mando", country: "کره جنوبی", qualityTier: "OEM_SUPPLIER" as const },
    { slug: "doowon", nameFa: "دوون", nameEn: "Doowon", country: "کره جنوبی", qualityTier: "OEM_SUPPLIER" as const },
    { slug: "high-copy", nameFa: "های‌کپی", nameEn: "High Copy", qualityTier: "HIGH_COPY" as const },
    { slug: "aftermarket", nameFa: "متفرقه", nameEn: "Aftermarket", qualityTier: "AFTERMARKET" as const },
  ];
  const brandIds: Record<string, string> = {};
  for (const b of brandSeed) {
    const created = await prisma.partBrand.create({ data: b });
    brandIds[b.slug] = created.id;
  }

  // -------------------------- تامین‌کننده ------------------------------------
  const supplierA = await prisma.supplier.create({
    data: { name: "انبار مرکزی", defaultLeadDays: 0, note: "موجودی خودمان" },
  });
  const supplierB = await prisma.supplier.create({
    data: { name: "پخش تهران", defaultLeadDays: 2 },
  });
  const supplierC = await prisma.supplier.create({
    data: { name: "واردکننده — سفارش کره", defaultLeadDays: 25 },
  });

  // ---------------------------- قطعات ---------------------------------------
  console.log("→ قطعات نمونه");

  // ۱) لنت ترمز جلو اسپورتیج — نمایش سه پیشنهاد با سه حالت قیمت
  const padsSportage = await prisma.part.create({
    data: {
      slug: "brake-pad-front-sportage-ql",
      nameFa: "لنت ترمز جلو کیا اسپورتیج نسل چهارم",
      nameEn: "Front Brake Pad Kia Sportage QL",
      categoryId: catIds["brake-pads-front"],
      description: "لنت ترمز جلو مناسب کیا اسپورتیج ۲۰۱۶ تا ۲۰۲۱، هر دو تیپ ۲.۰ و ۲.۴",
      weightGram: 2400,
      priceMode: "CURRENCY_LINKED",
      baseCurrencyCode: "USD",
      marginPercent: 28,
      allowMultiOffer: true,
      specs: { "محل نصب": "جلو", "تعداد در بسته": 4 },
    },
  });
  await prisma.partNumber.createMany({
    data: [
      { partId: padsSportage.id, ...pn("58101-D3A00"), type: "OEM", isPrimary: true, brandId: brandIds["mobis"] },
      { partId: padsSportage.id, ...pn("58101D3A10"), type: "SUPERSEDED", brandId: brandIds["mobis"] },
      { partId: padsSportage.id, ...pn("SP1650"), type: "AFTERMARKET", brandId: brandIds["hi-q"] },
    ],
  });
  await prisma.fitment.createMany({
    data: [
      { partId: padsSportage.id, makeId: kia.id, generationId: genIds["sportage/ql"], position: "FRONT", yearFrom: 2016, yearTo: 2021, verified: true },
    ],
  });
  await prisma.offer.createMany({
    data: [
      {
        partId: padsSportage.id, supplierId: supplierA.id, brandId: brandIds["mobis"],
        sku: "MOB-58101D3A00", isDefault: true, sortOrder: 1, stockQty: 12, leadTimeDays: 0,
        priceMode: "CURRENCY_LINKED", baseCurrencyCode: "USD", basePriceForeign: 48, marginPercent: 28,
      },
      {
        partId: padsSportage.id, supplierId: supplierB.id, brandId: brandIds["hi-q"],
        sku: "HIQ-SP1650", sortOrder: 2, stockQty: 30, leadTimeDays: 2,
        priceMode: "FIXED", basePriceIrr: 28_000_000, marginPercent: 22, discountPercent: 10,
        discountUntil: new Date(Date.now() + 7 * 864e5),
      },
      {
        partId: padsSportage.id, supplierId: supplierC.id, brandId: brandIds["high-copy"],
        sku: "HC-SP1650", sortOrder: 3, stockQty: 0, leadTimeDays: 25,
        priceMode: "INQUIRY",
      },
    ],
  });

  // ۲) فیلتر روغن توسان — قیمت ثابت ساده
  const oilFilterTucson = await prisma.part.create({
    data: {
      slug: "oil-filter-tucson-tl",
      nameFa: "فیلتر روغن هیوندای توسان",
      nameEn: "Oil Filter Hyundai Tucson TL",
      categoryId: catIds["oil-filter"],
      weightGram: 320,
      priceMode: "FIXED",
      marginPercent: 20,
    },
  });
  await prisma.partNumber.createMany({
    data: [
      { partId: oilFilterTucson.id, ...pn("26300-35504"), type: "OEM", isPrimary: true, brandId: brandIds["mobis"] },
      { partId: oilFilterTucson.id, ...pn("26300-35503"), type: "SUPERSEDED", brandId: brandIds["mobis"] },
    ],
  });
  await prisma.fitment.createMany({
    data: [
      { partId: oilFilterTucson.id, makeId: hyundai.id, generationId: genIds["tucson/tl"], position: "UNIVERSAL", verified: true },
      { partId: oilFilterTucson.id, makeId: hyundai.id, generationId: genIds["elantra/ad"], position: "UNIVERSAL", verified: true },
      { partId: oilFilterTucson.id, makeId: kia.id, generationId: genIds["cerato/yd"], position: "UNIVERSAL" },
    ],
  });
  await prisma.offer.createMany({
    data: [
      {
        partId: oilFilterTucson.id, supplierId: supplierA.id, brandId: brandIds["mobis"],
        sku: "MOB-2630035504", isDefault: true, stockQty: 60, leadTimeDays: 0,
        priceMode: "FIXED", basePriceIrr: 4_500_000, costPriceIrr: 3_600_000,
      },
      {
        partId: oilFilterTucson.id, supplierId: supplierB.id, brandId: brandIds["aftermarket"],
        sku: "AFT-2630035504", stockQty: 100, leadTimeDays: 1,
        priceMode: "FIXED", basePriceIrr: 2_100_000,
      },
    ],
  });

  // ۳) کمک فنر جلو النترا — فقط استعلام قیمت
  const shockElantra = await prisma.part.create({
    data: {
      slug: "shock-absorber-front-elantra-ad",
      nameFa: "کمک فنر جلو هیوندای النترا",
      nameEn: "Front Shock Absorber Hyundai Elantra AD",
      categoryId: catIds["shock-absorber"],
      weightGram: 4200,
      priceMode: "INQUIRY", // قیمت نمایش داده نمی‌شود، فقط دکمه استعلام
      allowInquiry: true,
    },
  });
  await prisma.partNumber.createMany({
    data: [
      { partId: shockElantra.id, ...pn("54651-F2AA0"), type: "OEM", isPrimary: true, brandId: brandIds["mobis"] },
      { partId: shockElantra.id, ...pn("54650-F2AA0"), type: "OEM", brandId: brandIds["mobis"], note: "سمت چپ" },
    ],
  });
  await prisma.fitment.create({
    data: { partId: shockElantra.id, makeId: hyundai.id, generationId: genIds["elantra/ad"], position: "FRONT_RIGHT", verified: true },
  });
  await prisma.offer.create({
    data: {
      partId: shockElantra.id, supplierId: supplierC.id, brandId: brandIds["mando"],
      sku: "MND-54651F2AA0", isDefault: true, stockQty: 0, leadTimeDays: 20, priceMode: "INQUIRY",
    },
  });

  // ۴) شمع سوناتا — قیمت ارزی با قفل قیمت
  const plugSonata = await prisma.part.create({
    data: {
      slug: "spark-plug-sonata-lf",
      nameFa: "شمع موتور هیوندای سوناتا",
      nameEn: "Spark Plug Hyundai Sonata LF",
      categoryId: catIds["spark-plug"],
      weightGram: 90,
      priceMode: "CURRENCY_LINKED",
      baseCurrencyCode: "USD",
      basePriceForeign: 9.5,
      marginPercent: 30,
      priceLocked: true, // با تغییر نرخ ارز جابه‌جا نشود
      lockedPriceIrr: 15_000_000,
    },
  });
  await prisma.partNumber.createMany({
    data: [
      { partId: plugSonata.id, ...pn("18855-10060"), type: "OEM", isPrimary: true, brandId: brandIds["mobis"] },
    ],
  });
  await prisma.fitment.create({
    data: { partId: plugSonata.id, makeId: hyundai.id, generationId: genIds["sonata/lf"], position: "UNIVERSAL", verified: true },
  });
  await prisma.offer.create({
    data: {
      partId: plugSonata.id, supplierId: supplierA.id, brandId: brandIds["mobis"],
      sku: "MOB-1885510060", isDefault: true, stockQty: 24, leadTimeDays: 0,
    },
  });

  // --------------------- گروه معادل‌ها (کراس‌رفرنس) --------------------------
  console.log("→ کراس‌رفرنس");
  const padNumbers = await prisma.partNumber.findMany({
    where: { partId: padsSportage.id },
  });
  const group = await prisma.crossGroup.create({
    data: { label: "لنت جلو اسپورتیج QL", source: "کاتالوگ سازنده", verified: true },
  });
  await prisma.crossGroupMember.createMany({
    data: padNumbers.map((n) => ({ groupId: group.id, partNumberId: n.id })),
  });

  const oldPad = padNumbers.find((n) => n.normalized === "58101D3A10");
  const newPad = padNumbers.find((n) => n.normalized === "58101D3A00");
  if (oldPad && newPad) {
    await prisma.supersession.create({
      data: { fromId: oldPad.id, toId: newPad.id, note: "کد قدیمی با کد جدید جایگزین شده" },
    });
  }

  // ---------------------------- تنظیمات -------------------------------------
  console.log("→ تنظیمات اولیه");
  const settings: Array<[string, unknown, string]> = [
    ["store.name", "میثاق یدک", "store"],
    ["pricing.defaultMode", "CURRENCY_LINKED", "pricing"],
    ["pricing.defaultMarginPercent", 25, "pricing"],
    ["pricing.defaultRounding", "NEAREST_10K", "pricing"],
    ["offers.multiOfferEnabled", true, "offers"],
    ["inquiry.enabled", true, "inquiry"],
  ];
  for (const [key, value, group] of settings) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never, group },
      update: { value: value as never },
    });
  }

  // -------------------------- کاربر مدیر ------------------------------------
  await prisma.user.upsert({
    where: { phone: "09120000000" },
    create: { phone: "09120000000", fullName: "مدیر سیستم", role: "ADMIN" },
    update: { role: "ADMIN" },
  });

  console.log("✓ داده اولیه با موفقیت ساخته شد");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
