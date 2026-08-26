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
# روی اینترنت کند، نصب چند دقیقه طول می‌کشد؛ بدون این تنظیمات بیلد با تایم‌اوت می‌شکند.
# کش npm هم mount می‌شود تا بیلدهای بعدی سریع باشند.
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --no-audit --no-fund

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

# -------------------------------- اجرا -------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# خروجی standalone و دارایی‌های عمومی
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# برای اجرای مهاجرت هنگام بالا آمدن کانتینر
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
