import Link from "next/link";
import type { SeoEntity } from "@prisma/client";
import { listRows, type StatusFilter } from "@/lib/seo-inventory";
import { ENTITY_LABEL, scoreTone } from "@/lib/seo-content";
import { faNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPES: SeoEntity[] = ["PART", "CAR_MODEL", "CAR_CATEGORY", "CATEGORY", "PAGE"];

const STATUSES: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "همه" },
  { key: "missing", label: "بدون محتوا" },
  { key: "thin", label: "محتوای نازک" },
  { key: "generated", label: "ساخته‌شده با قالب" },
  { key: "manual", label: "ویرایش دستی" },
  { key: "noindex", label: "خارج از ایندکس" },
];

const PER_PAGE = 40;

export default async function SeoPagesList({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const type = (TYPES.includes(sp.type as SeoEntity) ? sp.type : "PART") as SeoEntity;
  const status = (STATUSES.some((s) => s.key === sp.status) ? sp.status : "all") as StatusFilter;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const rows = await listRows(type, { q, status });
  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const link = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { type, status, q, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
    }
    return `/admin/seo/pages${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-black">صفحه‌ها</h1>
          <p className="pt-1.5 text-sm text-muted">
            <span className="tnum">{faNumber(rows.length)}</span> صفحه؛ ضعیف‌ترین‌ها بالا
          </p>
        </div>
        <Link href="/admin/seo" className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به خلاصه سئو
        </Link>
      </header>

      {/* نوع صفحه */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={link({ type: t, page: undefined })}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              t === type
                ? "border-brass bg-brass/10 font-bold text-brass-dark"
                : "border-line text-muted hover:border-brass"
            }`}
          >
            {ENTITY_LABEL[t]}
          </Link>
        ))}
      </div>

      {/* وضعیت + جستجو */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s.key}
              href={link({ status: s.key, page: undefined })}
              className={`text-xs transition-colors ${
                s.key === status ? "font-bold text-brass-dark" : "text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <form className="flex items-center gap-2">
          <input type="hidden" name="type" value={type} />
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو در نام یا شماره فنی"
            className="field w-56 py-1.5 text-xs"
          />
          <button type="submit" className="btn btn-ghost px-4 py-1.5 text-xs">
            جستجو
          </button>
        </form>
      </div>

      {/* جدول */}
      {visible.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">
          صفحه‌ای با این فیلتر پیدا نشد.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[720px]">
            <thead>
              <tr>
                <th className="w-16">امتیاز</th>
                <th>صفحه</th>
                <th className="w-24">کلمه</th>
                <th className="w-28">وضعیت</th>
                <th className="w-32">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const tone = scoreTone(row.score);
                return (
                  <tr key={row.entityKey}>
                    <td>
                      <span
                        className={`tnum inline-block rounded px-2 py-0.5 text-xs font-bold ${
                          tone === "ok"
                            ? "bg-ok/10 text-ok"
                            : tone === "warn"
                              ? "bg-brass/15 text-brass-dark"
                              : "bg-alert/10 text-alert"
                        }`}
                      >
                        {faNumber(row.score)}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium">{row.label}</div>
                      <div className="pt-1 text-xs text-faint">
                        {row.metaTitle ?? "بدون عنوان سئو"}
                      </div>
                      {row.issues.length > 0 ? (
                        <div className="pt-1 text-xs leading-6 text-alert">
                          {row.issues[0]}
                        </div>
                      ) : null}
                    </td>
                    <td className="tnum text-muted">{faNumber(row.words)}</td>
                    <td className="text-xs">
                      {!row.hasContent ? (
                        <span className="text-alert">بدون محتوا</span>
                      ) : row.isGenerated ? (
                        <span className="text-muted">با قالب</span>
                      ) : (
                        <span className="text-ok">دستی</span>
                      )}
                      {row.noindex ? (
                        <div className="pt-1 text-faint">خارج از ایندکس</div>
                      ) : null}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-xs">
                        <Link
                          href={`/admin/seo/edit?type=${type}&key=${encodeURIComponent(row.entityKey)}`}
                          className="font-bold text-brass-dark hover:underline"
                        >
                          ویرایش محتوا
                        </Link>
                        <Link
                          href={row.path}
                          target="_blank"
                          className="text-muted hover:text-ink"
                        >
                          دیدن صفحه ↗
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={link({ page: page - 1 })} className="btn btn-ghost px-4 py-2 text-xs">
              صفحه قبل
            </Link>
          ) : (
            <span />
          )}
          <span className="tnum text-xs text-faint">
            صفحه {faNumber(page)} از {faNumber(pageCount)}
          </span>
          {page < pageCount ? (
            <Link href={link({ page: page + 1 })} className="btn btn-ghost px-4 py-2 text-xs">
              صفحه بعد
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
