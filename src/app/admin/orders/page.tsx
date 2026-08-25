import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { faNumber } from "@/lib/format";
import { updateOrder } from "@/app/admin/actions";

const STATUS: Array<[string, string]> = [
  ["PENDING", "در انتظار تایید"],
  ["PAID", "پرداخت شده"],
  ["PREPARING", "در حال آماده‌سازی"],
  ["SHIPPED", "ارسال شده"],
  ["DELIVERED", "تحویل شده"],
  ["CANCELLED", "لغو شده"],
  ["RETURNED", "مرجوع شده"],
];

const PAYMENT: Array<[string, string]> = [
  ["UNPAID", "پرداخت نشده"],
  ["PAID", "پرداخت شده"],
  ["FAILED", "ناموفق"],
  ["REFUNDED", "بازگردانده شده"],
];

const STATUS_CLASS: Record<string, string> = {
  PENDING: "tier tier-genuine",
  PAID: "tier tier-genuine",
  PREPARING: "tier tier-oem",
  SHIPPED: "tier tier-oem",
  DELIVERED: "tier tier-oem",
  CANCELLED: "tier tier-copy",
  RETURNED: "tier tier-copy",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const [orders, settings, counts] = await Promise.all([
    prisma.order.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, address: true, user: true },
    }),
    getSettings(),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const unit = settings["store.displayUnit"] as "toman" | "rial";
  const countOf = (key: string) => counts.find((c) => c.status === key)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div>
      <div className="flex items-center gap-2.5 pb-6">
        <span className="size-[7px] rotate-45 bg-brass" />
        <h1 className="font-display text-xl font-black">سفارش‌ها</h1>
      </div>

      {/* فیلتر وضعیت */}
      <div className="flex flex-wrap gap-2 pb-6">
        <Link
          href="/admin/orders"
          className={status ? "btn btn-ghost px-3 py-1.5 text-xs" : "btn btn-primary px-3 py-1.5 text-xs"}
        >
          همه
          <span className="tnum pr-1 opacity-60">{faNumber(total)}</span>
        </Link>
        {STATUS.map(([value, label]) => {
          const n = countOf(value);
          if (n === 0) return null;
          return (
            <Link
              key={value}
              href={`/admin/orders?status=${value}`}
              className={
                status === value
                  ? "btn btn-primary px-3 py-1.5 text-xs"
                  : "btn btn-ghost px-3 py-1.5 text-xs"
              }
            >
              {label}
              <span className="tnum pr-1 opacity-60">{faNumber(n)}</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted">
          {status
            ? "سفارشی با این وضعیت نیست."
            : "هنوز سفارشی ثبت نشده است. با اولین خرید مشتری، سفارش‌ها اینجا می‌آیند."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="panel p-5">
              {/* سر سفارش */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="plate text-xs">{order.orderNo}</span>
                  <span className={STATUS_CLASS[order.status] ?? "tier tier-copy"}>
                    {STATUS.find(([v]) => v === order.status)?.[1] ?? order.status}
                  </span>
                  {order.paymentStatus === "PAID" ? (
                    <span className="tier tier-genuine">پرداخت شده</span>
                  ) : null}
                  <span className="text-xs text-faint">
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(order.createdAt)}
                  </span>
                </div>

                <div className="tnum font-display text-base font-black">
                  {formatMoney(Number(order.totalIrr), unit)}
                  <span className="pr-1 text-xs font-medium text-muted">{moneyLabel(unit)}</span>
                </div>
              </div>

              <div className="grid gap-5 py-4 md:grid-cols-[1fr_260px]">
                {/* اقلام */}
                <ul className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-baseline gap-3 text-sm">
                      <span className="min-w-[180px] flex-1">{item.titleFa}</span>
                      {item.partNumber ? (
                        <span className="plate text-[0.65rem]">{item.partNumber}</span>
                      ) : null}
                      <span className="tnum text-xs text-muted">{faNumber(item.qty)} عدد</span>
                      <span className="tnum text-xs font-medium">
                        {formatMoney(Number(item.totalPrice), unit)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* گیرنده */}
                <div className="text-sm">
                  <div className="font-medium">{order.user.fullName ?? "بدون نام"}</div>
                  <a href={`tel:${order.user.phone}`} className="mono block pt-1 text-xs">
                    {order.user.phone}
                  </a>
                  {order.address ? (
                    <p className="pt-2 text-xs leading-6 text-muted">
                      {order.address.province !== "—" ? `${order.address.province}، ` : ""}
                      {order.address.city}، {order.address.line}
                    </p>
                  ) : null}
                  {order.note ? (
                    <p className="pt-2 text-xs leading-6 text-brass-dark">{order.note}</p>
                  ) : null}
                </div>
              </div>

              {/* تغییر وضعیت */}
              <form
                action={updateOrder}
                className="flex flex-wrap items-end gap-3 border-t border-line pt-4"
              >
                <input type="hidden" name="id" value={order.id} />

                <label className="block">
                  <span className="field-label">وضعیت سفارش</span>
                  <select name="status" defaultValue={order.status} className="field w-44">
                    {STATUS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="field-label">وضعیت پرداخت</span>
                  <select
                    name="paymentStatus"
                    defaultValue={order.paymentStatus}
                    className="field w-40"
                  >
                    {PAYMENT.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block min-w-[180px] flex-1">
                  <span className="field-label">کد رهگیری مرسوله</span>
                  <input
                    name="trackingCode"
                    defaultValue={order.trackingCode ?? ""}
                    className="field mono"
                  />
                </label>

                <button type="submit" className="btn btn-ghost px-4 py-2 text-xs">
                  ذخیره
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
