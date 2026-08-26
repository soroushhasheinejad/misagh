# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# ایمیج پروژه — سه مرحله‌ای تا ایمیج نهایی سبک بماند
#   deps    نصب پکیج‌ها
#   builder ساخت Prisma Client و بیلد Next
#   runner  فقط خروجی standalone و فایل‌های لازم اجرا
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
# کتابخانه سازگاری برای باینری‌های Prisma روی Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ------------------------------- پکیج‌ها ------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./

# روی شبکه‌های ناپایدار، npm وسط دانلود ECONNRESET می‌گیرد. سه محافظ گذاشته شده:
#   ۱. کش npm که mount می‌شود، پس هر تلاش از جایی که مانده ادامه می‌دهد
#   ۲. تایم‌اوت و تعداد تلاش بالا، و کم کردن اتصال هم‌زمان
#   ۳. تکرار خود دستور تا پنج بار
# اگر پشت شبکه محدود هستید، می‌توانید آینه رجیستری بدهید:
#   docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN --mount=type=cache,target=/root/.npm \
    npm config set registry "$NPM_REGISTRY" && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 3 && \
    for attempt in 1 2 3 4 5; do \
      echo "→ نصب پکیج‌ها، تلاش $attempt"; \
      npm ci --no-audit --no-fund --prefer-offline && break; \
      echo "  تلاش $attempt ناموفق بود"; \
      sleep 5; \
    done; \
    test -d node_modules/next || (echo "✗ نصب پکیج‌ها بعد از پنج تلاش ناموفق ماند" && exit 1)

# -------------------------------- بیلد -------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client باید پیش از بیلد ساخته شود
RUN npx prisma generate

# بیلد نکست به DATABASE_URL نیاز ندارد چون همه صفحه‌ها در زمان اجرا رندر می‌شوند،
# ولی Prisma برای بارگذاری اسکیما یک مقدار می‌خواهد
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ------------------------- مهاجرت دیتابیس ----------------------------------
# CLI پریزما وابستگی‌های زیادی دارد که در خروجی standalone نیستند، پس مهاجرت
# در همان مرحله builder اجرا می‌شود که node_modules کامل دارد. کامپوز این را
# به‌عنوان سرویس یک‌بارمصرف قبل از اپ اجرا می‌کند.
FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

# -------------------------------- اجرا -------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# خروجی standalone خودش node_modules لازم را همراه دارد
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
