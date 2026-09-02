import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * آپلود تصویر قطعه.
 *
 * فایل در public/uploads می‌نشیند و آدرسش در جدول PartImage ثبت می‌شود.
 * دسترسی این مسیر در proxy بسته است، پس فقط از پنل قابل صدا زدن است.
 *
 * روی داکر، این پوشه باید volume داشته باشد وگرنه با هر بیلد دوباره
 * تصویرها پاک می‌شوند — در docker-compose تعریف شده است.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const partId = String(form.get("partId") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "فایلی انتخاب نشده است" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "حجم تصویر بیشتر از ۵ مگابایت است" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "فقط JPG، PNG، WebP و AVIF پذیرفته می‌شود" },
      { status: 400 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  // نام فایل تصادفی است تا نام اصلی کاربر مسیر را دستکاری نکند
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${name}`;

  if (partId) {
    const count = await prisma.partImage.count({ where: { partId } });
    const created = await prisma.partImage.create({
      data: {
        partId,
        url,
        alt: String(form.get("alt") ?? "") || null,
        sortOrder: count,
      },
    });
    await logAudit({ action: "create", entity: "partImage", entityId: created.id, after: created });
  }

  return NextResponse.json({ url });
}
