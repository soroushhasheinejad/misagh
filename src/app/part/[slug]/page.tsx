import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartBySlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { OfferTable } from "@/components/OfferTable";

const POSITION_LABEL: Record<string, string> = {
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

export default async function PartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPartBySlug(slug);
  if (!data) notFound();

  const { part, offers } = data;
  const settings = await getSettings();
  const primaryNumber = part.numbers.find((n) => n.isPrimary) ?? part.numbers[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="pb-3 text-xs text-faint">
        <Link href="/" className="hover:text-accent">
          خانه
        </Link>
        {" / "}
        {part.category.parent ? (
          <>
            <Link href={`/catalog?categoryId=${part.category.parent.id}`} className="hover:text-accent">
              {part.category.parent.nameFa}
            </Link>
            {" / "}
          </>
        ) : null}
        <Link href={`/catalog?categoryId=${part.category.id}`} className="hover:text-accent">
          {part.category.nameFa}
        </Link>
      </nav>

      <h1 className="text-xl font-bold">{part.nameFa}</h1>
      {primaryNumber ? (
        <div className="pt-2 text-sm text-muted">
          شماره فنی: <span className="pn font-medium text-ink">{primaryNumber.number}</span>
        </div>
      ) : null}
      {part.description ? <p className="pt-3 max-w-2xl text-sm text-muted">{part.description}</p> : null}

      <section className="pt-6">
        <h2 className="pb-2 text-sm font-bold">پیشنهادهای موجود</h2>
        <OfferTable
          offers={offers}
          settings={settings}
          partName={part.nameFa}
          partNumber={primaryNumber?.number}
        />
      </section>

      <div className="grid gap-6 pt-8 lg:grid-cols-2">
        <section>
          <h2 className="pb-2 text-sm font-bold">خودروهای سازگار</h2>
          <div className="overflow-x-auto rounded border border-line bg-surface">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="bg-surface-2 text-xs text-faint">
                  <th className="px-3 py-2 text-right font-medium">خودرو</th>
                  <th className="px-3 py-2 text-right font-medium">سال</th>
                  <th className="px-3 py-2 text-right font-medium">محل نصب</th>
                </tr>
              </thead>
              <tbody>
                {part.fitments.map((f) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      {[f.make?.nameFa, f.model?.nameFa, f.generation?.nameFa, f.trim?.nameFa]
                        .filter(Boolean)
                        .join(" ")}
                      {f.note ? <span className="text-xs text-faint"> — {f.note}</span> : null}
                    </td>
                    <td className="tnum px-3 py-2 text-muted">
                      {f.yearFrom ?? f.generation?.yearStart ?? "—"}
                      {(f.yearTo ?? f.generation?.yearEnd) ? ` تا ${f.yearTo ?? f.generation?.yearEnd}` : ""}
                    </td>
                    <td className="px-3 py-2 text-muted">{POSITION_LABEL[f.position] ?? f.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="pb-2 text-sm font-bold">شماره‌های فنی و معادل‌ها</h2>
          <div className="overflow-x-auto rounded border border-line bg-surface">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="bg-surface-2 text-xs text-faint">
                  <th className="px-3 py-2 text-right font-medium">شماره</th>
                  <th className="px-3 py-2 text-right font-medium">نوع</th>
                  <th className="px-3 py-2 text-right font-medium">برند</th>
                </tr>
              </thead>
              <tbody>
                {part.numbers.map((n) => (
                  <tr key={n.id} className="border-t border-line">
                    <td className="pn px-3 py-2 font-medium">{n.number}</td>
                    <td className="px-3 py-2 text-muted">
                      {n.type === "OEM"
                        ? "اصلی سازنده"
                        : n.type === "SUPERSEDED"
                          ? "کد قدیمی"
                          : n.type === "AFTERMARKET"
                            ? "بازار"
                            : "داخلی"}
                    </td>
                    <td className="px-3 py-2 text-muted">{n.brand?.nameFa ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
