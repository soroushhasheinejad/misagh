# راه‌اندازی روی سرور

این راهنما برای کسی نوشته شده که می‌خواهد پروژه را روی سرور خودش بالا بیاورد.
از صفر تا سایت در حال اجرا، حدود ۲۰ دقیقه.

---

# روش اول (پیشنهادی): اجرا با داکر

کل پروژه — خود اپلیکیشن و دیتابیس — با یک دستور بالا می‌آید. روی سرور فقط داکر لازم است.

## گام ۱ — کد و تنظیمات

```bash
git clone https://github.com/soroushhasheinejad/misagh.git
cd misagh
cp .env.docker.example .env
```

فایل `.env` را باز کنید و این چهار مقدار را پر کنید:

```bash
POSTGRES_PASSWORD=یک-رمز-قوی
ADMIN_PASSWORD=رمز-ورود-به-پنل
AUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_SITE_URL=https://example.com
```

اگر `NEXT_PUBLIC_SITE_URL` را خالی بگذارید، آدرس سایت از هدر خود درخواست خوانده
می‌شود و نقشه سایت باز هم درست کار می‌کند — ولی بهتر است دامنه نهایی را بنویسید.

بدون `ADMIN_PASSWORD` و `AUTH_SECRET` کامپوز عمداً بالا نمی‌آید و خطا می‌دهد.

## گام ۲ — بالا آوردن

```bash
docker compose up -d --build
```

این کار خودش:

۱. ایمیج اپلیکیشن را می‌سازد
۲. پستگرس را بالا می‌آورد و منتظر سالم شدنش می‌ماند
۳. مهاجرت‌های دیتابیس را اجرا می‌کند
۴. سایت را روی پورت ۳۰۰۰ بالا می‌آورد

بیلد بار اول بسته به سرعت اینترنت ممکن است ۵ تا ۱۵ دقیقه طول بکشد؛ بیشترش صرف نصب
پکیج‌هاست. دفعات بعد از کش استفاده می‌شود و سریع است.

## گام ۳ — داده

```bash
gunzip -c data/misagh-database.sql.gz | docker compose exec -T db psql -U misagh -d misagh
```

اگر می‌خواهید به‌جای دامپ کامل با داده اولیه شروع کنید، `SEED_ON_START=true` را در
`.env` بگذارید و کانتینر را دوباره اجرا کنید.

## دستورهای روزمره

```bash
docker compose logs -f app        # دیدن لاگ‌ها
docker compose restart app        # ری‌استارت
docker compose down               # خاموش کردن
docker compose up -d --build      # به‌روزرسانی بعد از git pull
```

پورت دیتابیس فقط روی `127.0.0.1` باز است، پس از بیرون سرور در دسترس نیست.

---

# روش دوم: اجرای مستقیم روی سرور (بدون داکر)

## چه چیزی لازم است

| مورد | نسخه | توضیح |
|---|---|---|
| Node.js | ۲۰ یا بالاتر | نسخه ۲۲ تست شده است |
| PostgreSQL | ۱۴ یا بالاتر | نسخه ۱۶ تست شده است |
| رم سرور | حداقل ۱ گیگ | برای بیلد ۲ گیگ راحت‌تر است |

**میلی‌سرچ و ردیس لازم نیستند.** در `docker-compose.yml` زیر پروفایل `future` هستند و
به‌صورت پیش‌فرض بالا نمی‌آیند، چون کد فعلاً به هیچ‌کدام وصل نمی‌شود.

---

## گام ۱ — گرفتن کد

```bash
git clone https://github.com/soroushhasheinejad/misagh.git
cd misagh
npm ci
```

## گام ۲ — دیتابیس

اگر پستگرس ندارید، ساده‌ترین راه با داکر:

```bash
docker compose up -d db
```

این یک پستگرس روی پورت `5433` بالا می‌آورد با کاربر `misagh` و رمز `misagh_dev_password`.
**روی سرور واقعی این رمز را عوض کنید** — هم در `docker-compose.yml` و هم در `.env`.

اگر پستگرس خودتان را دارید، فقط یک دیتابیس خالی بسازید:

```sql
CREATE DATABASE misagh;
CREATE USER misagh WITH PASSWORD 'یک-رمز-قوی';
GRANT ALL PRIVILEGES ON DATABASE misagh TO misagh;
```

## گام ۳ — فایل تنظیمات

از روی نمونه بسازید:

```bash
cp .env.example .env
```

و مقادیر را پر کنید:

```bash
DATABASE_URL="postgresql://misagh:رمز@localhost:5433/misagh?schema=public"

# آدرس نهایی سایت — برای نقشه سایت و robots استفاده می‌شود
NEXT_PUBLIC_SITE_URL="https://example.com"

# ورود پنل مدیریت
ADMIN_PASSWORD="یک-رمز-قوی"
AUTH_SECRET="یک-رشته-تصادفی-حداقل-۳۲-کاراکتر"
```

برای ساختن `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

بدون این دو مقدار، پنل مدیریت باز نمی‌شود و صفحه ورود پیام خطا می‌دهد.

## گام ۴ — ساخت جدول‌ها

```bash
npx prisma migrate deploy
```

روی سرور از `migrate deploy` استفاده کنید، نه `migrate dev`. دومی برای محیط توسعه است
و می‌تواند دیتابیس را ریست کند.

## گام ۵ — داده

دو مسیر دارید:

### الف) بازگرداندن نسخه کامل (پیشنهادی)

فایل `data/misagh-database.sql.gz` یک دامپ کامل است: ۵٬۴۴۱ قطعه، ۴۸ نسل خودرو،
دسته‌بندی‌ها، برندها، مقاله‌های بلاگ و تنظیمات فروشگاه.

```bash
gunzip -c data/misagh-database.sql.gz | psql "$DATABASE_URL"
```

اگر گام ۴ را اجرا کرده‌اید، جدول‌ها از قبل هستند و ممکن است هنگام بازگرداندن خطای
«جدول موجود است» ببینید. در این حالت روی دیتابیس خالی بازگردانید و گام ۴ را رد کنید.

### ب) شروع با داده اولیه

```bash
npm run db:seed
```

این فقط خودروها، دسته‌بندی‌ها، برندها، ارزها و چند قطعه نمونه را می‌سازد — بدون
کاتالوگ ۵٬۴۴۱ تایی. برای وارد کردن کاتالوگ کامل به فایل خام انبار نیاز دارید:

```bash
npx tsx scripts/import-products.mts /مسیر/فایل-انبار.xls
```

## گام ۶ — بیلد و اجرا

```bash
npm run build
npm start
```

سایت روی پورت `3000` بالا می‌آید. برای تغییر پورت:

```bash
PORT=8080 npm start
```

---

## اجرای دائمی

`npm start` با بستن ترمینال قطع می‌شود. برای اینکه سرویس بماند:

### با pm2

```bash
npm install -g pm2
pm2 start "npm start" --name misagh
pm2 save
pm2 startup
```

### با systemd

فایل `/etc/systemd/system/misagh.service`:

```ini
[Unit]
Description=misagh
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/misagh
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now misagh
```

## nginx و HTTPS

```nginx
server {
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

برای گواهی HTTPS:

```bash
certbot --nginx -d example.com
```

**نکته امنیتی:** کوکی نشست پنل مدیریت در حالت production فقط روی HTTPS ارسال می‌شود.
اگر سایت را روی HTTP بالا بیاورید، ورود به پنل کار نمی‌کند.

---

## پنل مدیریت

آدرس: `/admin` — با رمزی که در `ADMIN_PASSWORD` گذاشته‌اید.

از پنل می‌توانید نرخ ارز، قیمت هر قطعه، موجودی، سفارش‌ها، استعلام‌ها، مقاله‌های بلاگ و
همه سوییچ‌های فروشگاه را مدیریت کنید. لینک پنل در سربرگ سایت نیست و برای بازدیدکننده
پیدا نمی‌شود؛ فقط با تایپ مستقیم آدرس باز می‌شود.

## به‌روزرسانی نسخه

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart misagh   # یا systemctl restart misagh
```

---

## چیزهایی که هنوز وصل نشده‌اند

| مورد | برای فعال شدن چه لازم است |
|---|---|
| درگاه پرداخت | نماد اعتماد الکترونیکی و قرارداد درگاه (زرین‌پال یا بانکی) |
| ورود پیامکی مشتری | حساب پنل پیامک ایرانی و کلید API |
| جستجوی متنی سریع | اتصال میلی‌سرچ که کانتینرش آماده است |

سفارش‌ها الان با وضعیت «در انتظار تایید» ثبت می‌شوند و هماهنگی پرداخت تلفنی است.
معماری پرداخت ماژولار نوشته شده، پس اتصال درگاه بدون بازنویسی انجام می‌شود.

## اگر به مشکل خوردید

**بیلد با خطای Prisma متوقف می‌شود:** `npx prisma generate` را جدا اجرا کنید.

**صفحه‌ها خالی می‌آیند:** احتمالاً `DATABASE_URL` غلط است یا پستگرس بالا نیست.
با `npx prisma db execute --stdin <<< "SELECT 1"` اتصال را تست کنید.

**قیمت‌ها عجیب‌اند:** نرخ ارز در `/admin/rates` را تنظیم کنید. قیمت‌های وابسته به ارز
با همان نرخ محاسبه می‌شوند.

**فونت‌ها نمی‌آیند:** فونت‌ها لوکال‌اند و در `public/fonts` قرار دارند؛ این پوشه باید
همراه کد منتقل شود.
