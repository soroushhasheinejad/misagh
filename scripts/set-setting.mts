/** ابزار خط فرمان برای تغییر یک تنظیم: npx tsx scripts/set-setting.mts <key> <json-value> */
import { PrismaClient } from "@prisma/client";

const [key, rawValue] = process.argv.slice(2);
if (!key || rawValue === undefined) {
  console.error("usage: npx tsx scripts/set-setting.mts <key> <json-value>");
  process.exit(1);
}

const prisma = new PrismaClient();
const value = JSON.parse(rawValue);

prisma.setting
  .upsert({
    where: { key },
    create: { key, value, group: key.split(".")[0] },
    update: { value },
  })
  .then(() => console.log(`${key} = ${rawValue}`))
  .finally(() => prisma.$disconnect());
