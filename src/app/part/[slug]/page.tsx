import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartBySlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { OfferTable } from "@/components/OfferTable";

const POSITION: Record<string, string> = {
  UNIVERSAL: "—",
  FRONT: "جلو",
  REAR: "عقب",
  LEFT: "چپ",
  RIGHT: "راست",
  FRONT_LEFT: "جلو چپ",
  FRONT_RIGHT: "جلو راست",
  REAR_LEFT: "عقب چپ",
  REAR_RIGHT: "عقب راست",
  UPPER: "بالا",
  LOWER: "پایین",
};

const NUMBER_TYPE: Record<string, string> = {
  OEM: "اصلی سازنده",
  SUPERSEDED: "کد قدیمی",
  AFTERMARKET: "بازار",
  INTERNAL: "داخلی",
};

export default async function PartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPartBySlug(slug);
  if (!data) notFound();

  const { part, offers } = data;
  const settings = await getSettings();
  const primary = part.numbers.find((n) => n.isPrimary) ?? part.numbers[0];
  const specs = (part.specs ?? null) as Record<string, string | number> | null;

  return (
    <div>
      {/* سربرگ قطعه */}
      <div className="bg-carbon text-white">
        <div className="mx-auto max-w-[1120px] px-5 py-9">
          <nav className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-white/40">
            <Link href="/" className="hover:text-brass">
              home
            </Link>
            <span className="px-2">/</span>
            <Link href={`/catalog?categoryId=${part.category.id}`} className="hover:text-brass">
              {part.category.nameFa}
            </Link>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6 pt-4">
            <div>
              <h1 className="max-w-2xl font-display text-2xl font-black leading-[1.6]">
                {part.nameFa}
              </h1>
              {part.brand ? (
                <div className="pt-2 text-sm text-white/60">برند: {part.brand.nameFa}</div>
              ) : null}
            </div>
            {primary ? <span className="plate plate-dark plate-lg">{primary.number}</span> : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        {part.description ? (
          <p className="max-w-2xl pb-8 text-muted">{part.description}</p>
        ) : null}

        <section>
          <div className="rule pb-4">
            <h2 className="font-display text-base font-bold">پیشنهادهای فروش</h2>
            <span className="rule-label">offers</span>
          </div>
          <OfferTable
            offers={offers}
            settings={settings}
            partName={part.nameFa}
            partNumber={primary?.number}
          />
        </section>

        <div className="grid gap-10 pt-12 lg:grid-cols-2">
          <section>
            <div className="rule pb-4">
              <h2 className="font-display text-base font-bold">خودروهای سازگار</h2>
              <span className="rule-label">fitment</span>
            </div>
            <div className="panel overflow-x-auto">
              <table className="spec min-w-[420px]">
                <thead>
                  <tr>
                    <th>خودرو</th>
                    <th>سال</th>
                    <th>محل نصب</th>
                  </tr>
                </thead>
                <tbody>
                  {part.fitments.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="font-medium">
                          {[f.make?.nameFa, f.model?.nameFa, f.generation?.nameFa, f.trim?.nameFa]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                        {f.note ? <div className="text-xs text-faint">{f.note}</div> : null}
                      </td>
                      <td className="tnum text-muted">
                        {f.yearFrom ?? f.generation?.yearStart ?? "—"}
                        {(f.yearTo ?? f.generation?.yearEnd)
                          ? ` – ${f.yearTo ?? f.generation?.yearEnd}`
                          : ""}
                      </td>
                      <td className="text-muted">{POSITION[f.position] ?? f.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="rule pb-4">
              <h2 className="font-display text-base font-bold">شماره‌های فنی</h2>
              <span className="rule-label">part numbers</span>
            </div>
            <div className="panel overflow-x-auto">
              <table className="spec min-w-[380px]">
                <thead>
                  <tr>
                    <th>شماره</th>
                    <th>نوع</th>
                    <th>برند</th>
                  </tr>
                </thead>
                <tbody>
                  {part.numbers.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <span className="plate text-xs">{n.number}</span>
                      </td>
                      <td className="text-muted">{NUMBER_TYPE[n.type] ?? n.type}</td>
                      <td className="text-muted">{n.brand?.nameFa ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {specs && Object.keys(specs).length > 0 ? (
              <div className="pt-8">
                <div className="rule pb-4">
                  <h2 className="font-display text-base font-bold">مشخصات</h2>
                  <span className="rule-label">specs</span>
                </div>
                <div className="panel overflow-hidden">
                  <table className="spec">
                    <tbody>
                      {Object.entries(specs).map(([key, value]) => (
                        <tr key={key}>
                          <td className="w-1/2 text-muted">{key}</td>
                          <td className="font-medium">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
