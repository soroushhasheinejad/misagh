#!/bin/sh
set -e

# منتظر آماده شدن دیتابیس می‌ماند — کانتینر اپ معمولاً زودتر از پستگرس بالا می‌آید
echo "→ در انتظار دیتابیس…"
tries=0
until node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1\`.then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -ge 30 ]; then
    echo "✗ دیتابیس در دسترس نیست. DATABASE_URL را بررسی کنید."
    exit 1
  fi
  sleep 2
done
echo "✓ دیتابیس آماده است"

# ساخت یا به‌روزرسانی جدول‌ها
echo "→ اجرای مهاجرت‌ها"
./node_modules/.bin/prisma migrate deploy

# اگر دیتابیس خالی است، داده اولیه ساخته شود
if [ "${SEED_ON_START:-false}" = "true" ]; then
  count=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.part.count().then((n) => { console.log(n); process.exit(0); }).catch(() => { console.log(0); process.exit(0); });
")
  if [ "$count" = "0" ]; then
    echo "→ دیتابیس خالی است، داده اولیه ساخته می‌شود"
    node prisma/seed.js 2>/dev/null || echo "  (اسکریپت seed در ایمیج تولیدی نیست؛ از دامپ استفاده کنید)"
  fi
fi

echo "✓ اجرای برنامه"
exec "$@"
