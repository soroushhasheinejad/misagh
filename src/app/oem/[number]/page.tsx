import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPartByNumber, searchByOem } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { normalizePartNumber, formatPartNumber } from "@/lib/normalize";
import { BuyBar } from "@/components/BuyBar";
import { faNumber } from "@/lib/format";
import { Breadcrumbs, breadcrumbSchema, JsonLd } from "@/components/Seo";

type Params = { number: string };

/**
 * صفحه اختصاصی هر شماره فنی — «۵۸۱۰۱-D3A00».
 *
 * مکانیک و قطعه‌فروش معمولاً خود کد را در گوگل می‌نویسد، نه نام فارسی قطعه.
 * رقیب اصلی این بازار چنین صفحه‌ای ندارد، پس این کم‌رقابت‌ترین مسیر ورود است.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { number } = await params;
  const normalized = normalizePartNumber(decodeURIComponent(number));
  const found = await getPartByNumber(normalized);
  if (!found) return { title: "شماره فنی پیدا نشد" };

  const display = found.number.number;
  const name = found.part.titleFa ?? found.part.nameFa;
  return {
    title: `${display} — ${name}`,
    description: `شماره فنی ${display} مربوط به ${name} است. کدهای معادل، خودروهای سازگار و استعلام قیمت روز.`,
    alternates: { canonical: `/oem/${encodeURIComponent(normalized)}` },
  };
}

export default async function OemPage({ params }: { params: Promise<Params> }) {
  const { number } = await params;
  const normalized = normalizePartNumber(decodeURIComponent(number));

  const [found, settings] = await Promise.all([getPartByNumber(normalized), getSettings()]);
  if (!found) notFound();

  const { part, offers, number: partNumber } = found;
  const name = part.titleFa ?? part.nameFa;
  const display = partNumber.number;

  // کدهای معادل از موتور کراس‌رفرنس
  const cross = await searchByOem(normalized);
  const equivalents = cross.matches
    .flatMap((m) => m.numbers)
    .filter((n) => normalizePartNumber(n.number) !== normalized);

  const crumbs = [
    { name: "خانه", url: "/" },
    { name: "شماره فنی", url: "/search" },
    { name: display, url: `/oem/${encodeURIComponent(normalized)}` },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <section className="border-b border-brass/25 bg-carbon py-10 text-white">
        <div className="mx-auto max-w-[1120px] px-5">
          <Breadcrumbs items={crumbs.slice(0, -1)} />

          <div className="flex flex-wrap items-center gap-4 pt-5">
            <span className="plate plate-dark plate-lg">{formatPartNumber(display)}</span>
            <h1 className="font-display text-xl font-black">{name}</h1>
          </div>

          <p className="max-w-2xl pt-4 leading-8 text-white/60">
            شماره فنی {formatPartNumber(display)} مربوط به {name} است
            {equivalents.length > 0
              ? ` و ${faNumber(equivalents.length)} کد معادل یا جایگزین دارد.`
              : "."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="pb-8">
          <BuyBar
            offers={offers}
            partName={name}
            partNumber={display}
            unit={settings["store.displayUnit"] as "toman" | "rial"}
            telegram={String(settings["inquiry.telegramUsername"] ?? "").trim() || undefined}
          />
        </div>

        {/* کدهای معادل */}
        {equivalents.length > 0 ? (
          <section className="pb-10">
            <div className="flex items-center gap-2.5 pb-4">
              <span className="size-[7px] rotate-45 bg-brass" />
              <h2 className="font-display text-base font-bold">
                کدهای معادل {formatPartNumber(display)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {equivalents.map((eq) => (
                <Link
                  key={eq.number}
                  href={`/oem/${encodeURIComponent(normalizePartNumber(eq.number))}`}
                  className="plate text-xs transition-colors hover:border-brass"
                >
                  {eq.number}
                </Link>
              ))}
            </div>
            <p className="pt-3 text-xs leading-6 text-faint">
              این کدها با هم قابل جایگزینی‌اند؛ اگر کد اصلی موجود نبود، معادلش را بگیرید.
            </p>
          </section>
        ) : null}

        <div className="panel flex flex-wrap items-center justify-between gap-4 bg-steel-2 p-6">
          <div>
            <div className="font-display text-base font-bold">
              مشخصات کامل و خودروهای سازگار
            </div>
            <p className="pt-1 text-sm text-muted">
              جدول سازگاری، مشخصات فنی و بقیه کدهای این قطعه در صفحه محصول است.
            </p>
          </div>
          <Link
            href={`/part/${encodeURIComponent(part.slug)}`}
            className="btn btn-brass"
          >
            دیدن صفحه قطعه
          </Link>
        </div>
      </div>
    </div>
  );
}
