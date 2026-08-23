import { prisma } from "@/lib/prisma";
import { updateInquiryStatus } from "@/app/admin/actions";

const STATUS: Array<[string, string]> = [
  ["NEW", "جدید"],
  ["IN_PROGRESS", "در حال بررسی"],
  ["QUOTED", "قیمت اعلام شد"],
  ["WON", "به فروش رسید"],
  ["LOST", "منتفی شد"],
];

const STATUS_CLASS: Record<string, string> = {
  NEW: "tier tier-genuine",
  IN_PROGRESS: "tier tier-oem",
  QUOTED: "tier tier-oem",
  WON: "tier tier-genuine",
  LOST: "tier tier-copy",
};

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { part: true },
  });

  const open = inquiries.filter((i) => i.status === "NEW" || i.status === "IN_PROGRESS").length;

  return (
    <div>
      <div className="rule pb-6">
        <h1 className="font-display text-xl font-black">استعلام‌ها</h1>
        <span className="rule-label">inquiries</span>
      </div>

      <p className="pb-5 text-sm text-muted">
        {inquiries.length.toLocaleString("fa-IR")} درخواست ثبت شده،{" "}
        {open.toLocaleString("fa-IR")} مورد باز.
      </p>

      {inquiries.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted">
          هنوز استعلامی ثبت نشده است. با پر شدن فرم استعلام، درخواست‌ها اینجا می‌آیند.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((inq) => (
            <form
              key={inq.id}
              action={updateInquiryStatus}
              className="panel flex flex-wrap items-end gap-4 p-5"
            >
              <input type="hidden" name="id" value={inq.id} />

              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STATUS_CLASS[inq.status] ?? "tier tier-copy"}>
                    {STATUS.find(([v]) => v === inq.status)?.[1] ?? inq.status}
                  </span>
                  <span className="font-mono text-[0.68rem] text-faint">
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(inq.createdAt)}
                  </span>
                </div>

                <div className="pt-2 font-display text-sm font-bold">
                  {inq.partText || inq.part?.nameFa || "قطعه نامشخص"}
                </div>
                <div className="pt-1 text-xs text-muted">
                  {inq.vehicleText ? `${inq.vehicleText} — ` : ""}
                  {inq.fullName ?? "بدون نام"}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a href={`tel:${inq.phone}`} className="mono text-xs font-bold">
                    {inq.phone}
                  </a>
                  {inq.partNumber ? <span className="plate text-[0.65rem]">{inq.partNumber}</span> : null}
                </div>
              </div>

              <label className="block">
                <span className="field-label">وضعیت</span>
                <select name="status" defaultValue={inq.status} className="field w-40">
                  {STATUS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="field-label">قیمت اعلام‌شده (ریال)</span>
                <input
                  name="quotedPrice"
                  type="number"
                  defaultValue={inq.quotedPrice ? Number(inq.quotedPrice) : ""}
                  className="field tnum w-44"
                />
              </label>

              <label className="block min-w-[200px] flex-1">
                <span className="field-label">یادداشت</span>
                <input name="responseNote" defaultValue={inq.responseNote ?? ""} className="field" />
              </label>

              <button type="submit" className="btn btn-ghost px-4 py-2 text-xs">
                ذخیره
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
