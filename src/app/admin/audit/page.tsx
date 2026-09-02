import { prisma } from "@/lib/prisma";
import { AUDIT_ENTITY, AUDIT_ACTION } from "@/lib/audit";
import { faNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const PER_PAGE = 60;

/** تاریخچه تغییرات پنل — چه کسی چه چیزی را کی عوض کرد */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.entity ? { entity: sp.entity } : {};

  const [rows, total, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["entity"], _count: { entity: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const fmt = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-xl font-black">تاریخچه تغییرات</h1>
        <p className="pt-2 text-sm text-muted">
          <span className="tnum">{faNumber(total)}</span> رویداد ثبت شده
        </p>
      </header>

      <div className="flex flex-wrap gap-3 text-xs">
        <a
          href="/admin/audit"
          className={!sp.entity ? "font-bold text-brass-dark" : "text-muted hover:text-ink"}
        >
          همه
        </a>
        {entities.map((e) => (
          <a
            key={e.entity}
            href={`/admin/audit?entity=${e.entity}`}
            className={
              sp.entity === e.entity ? "font-bold text-brass-dark" : "text-muted hover:text-ink"
            }
          >
            {AUDIT_ENTITY[e.entity] ?? e.entity}
            <span className="tnum pr-1 text-faint">({faNumber(e._count.entity)})</span>
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">
          هنوز رویدادی ثبت نشده است. از این پس هر تغییری در پنل اینجا می‌آید.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="spec min-w-[560px]">
            <thead>
              <tr>
                <th className="w-40">زمان</th>
                <th className="w-28">کار</th>
                <th className="w-36">روی چه چیزی</th>
                <th>شناسه</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="tnum text-muted">{fmt.format(row.createdAt)}</td>
                  <td>
                    <span
                      className={
                        row.action === "delete"
                          ? "text-alert"
                          : row.action === "create"
                            ? "text-ok"
                            : "text-muted"
                      }
                    >
                      {AUDIT_ACTION[row.action] ?? row.action}
                    </span>
                  </td>
                  <td className="font-medium">{AUDIT_ENTITY[row.entity] ?? row.entity}</td>
                  <td className="text-xs text-faint" dir="ltr">
                    {row.entityId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <a
              href={`/admin/audit?${sp.entity ? `entity=${sp.entity}&` : ""}page=${page - 1}`}
              className="btn btn-ghost px-4 py-2 text-xs"
            >
              صفحه قبل
            </a>
          ) : (
            <span />
          )}
          <span className="tnum text-xs text-faint">
            صفحه {faNumber(page)} از {faNumber(pageCount)}
          </span>
          {page < pageCount ? (
            <a
              href={`/admin/audit?${sp.entity ? `entity=${sp.entity}&` : ""}page=${page + 1}`}
              className="btn btn-ghost px-4 py-2 text-xs"
            >
              صفحه بعد
            </a>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
