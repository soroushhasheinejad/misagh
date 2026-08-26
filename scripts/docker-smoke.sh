#!/usr/bin/env bash
# تست دود استقرار داکری: استک را بالا می‌آورد و مطمئن می‌شود سایت واقعاً جواب می‌دهد.
#   ./scripts/docker-smoke.sh
set -euo pipefail

PORT="${APP_PORT:-3000}"
BASE="http://localhost:${PORT}"

echo "→ بالا آوردن استک"
docker compose up -d

echo "→ در انتظار سالم شدن سرویس‌ها"
tries=0
until curl -sf -o /dev/null "${BASE}/"; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "✗ سایت بالا نیامد. لاگ:"
    docker compose logs --tail 40 app
    exit 1
  fi
  sleep 3
done
echo "✓ سایت جواب می‌دهد"

echo "→ بررسی صفحه‌ها"
fail=0
for path in "/" "/catalog" "/vehicles" "/blog" "/inquiry" "/cart" "/sitemap.xml" "/robots.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${path}")
  if [ "$code" = "200" ]; then
    printf "  ✓ %-16s %s\n" "$path" "$code"
  else
    printf "  ✗ %-16s %s\n" "$path" "$code"
    fail=1
  fi
done

# پنل باید بسته باشد
code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/admin")
if [ "$code" = "307" ] || [ "$code" = "302" ]; then
  printf "  ✓ %-16s %s (به صفحه ورود می‌رود)\n" "/admin" "$code"
else
  printf "  ✗ %-16s %s (باید ریدایرکت شود)\n" "/admin" "$code"
  fail=1
fi

echo "→ بررسی مهاجرت‌ها"
docker compose exec -T db psql -U "${POSTGRES_USER:-misagh}" -d "${POSTGRES_DB:-misagh}" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" \
  | xargs -I{} echo "  جدول‌های ساخته‌شده: {}"

if [ "$fail" = "0" ]; then
  echo "✓ همه چیز سالم است"
else
  echo "✗ بعضی صفحه‌ها مشکل دارند"
  exit 1
fi
