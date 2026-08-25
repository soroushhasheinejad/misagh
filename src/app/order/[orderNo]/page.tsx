import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney, moneyLabel } from "@/lib/pricing";
import { faNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "سفارش ثبت شد",
  robots: { index: false, follow: false },
};

const STATUS: Record<string, string> = {
  PENDING: "در انتظار تایید",
  PAID: "پرداخت شده",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
  RETURNED: "مرجوع شده",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { orderNo },
      include: { items: true, address: true },
    }),
    getSettings(),
  ]);
  if (!order) notFound();

  const unit = settings["store.displayUnit"] as "toman" | "rial";

  return (
    <div className="mx-auto max-w-[720px] px-5 py-16">
      <span className="block size-[7px] rotate-45 bg-ok" />
      <h1 className="pt-5 font-display text-2xl font-black">سفارش شما ثبت شد</h1>
      <p className="max-w-lg pt-3 leading-8 text-muted">
        کارشناس ما موجودی را تایید و برای هماهنگی پرداخت و ارسال تماس می‌گیرد. شماره سفارش را
        نگه دارید.
      </p>

      <div className="panel panel-brass mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs text-muted">شماره سفارش</div>
            <div className="pt-1">
              <span className="plate plate-lg">{order.orderNo}</span>
            </div>
          </div>
          <span className="rounded bg-brass-soft px-3 py-1 text-xs text-brass-dark">
            {STATUS[order.status] ?? order.status}
          </span>
        </div>

        <ul className="flex flex-col gap-3 py-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-medium">{item.titleFa}</div>
                {item.partNumber ? (
                  <span className="plate mt-1 inline-block text-[0.65rem]">{item.partNumber}</span>
                ) : null}
              </div>
              <div className="tnum text-xs text-muted">{faNumber(item.qty)} عدد</div>
              <div className="tnum font-display text-sm font-bold">
                {formatMoney(Number(item.totalPrice), unit)}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">جمع سفارش</span>
          <span className="tnum font-display text-lg font-black">
            {formatMoney(Number(order.totalIrr), unit)}
            <span className="pr-1 text-xs font-medium text-muted">{moneyLabel(unit)}</span>
          </span>
        </div>

        {order.address ? (
          <div className="mt-4 border-t border-line pt-4 text-sm">
            <div className="text-xs text-muted">تحویل به</div>
            <div className="pt-1 font-medium">{order.address.fullName}</div>
            <div className="pt-1 leading-7 text-muted">
              {order.address.province !== "—" ? `${order.address.province}، ` : ""}
              {order.address.city}، {order.address.line}
            </div>
            <div className="mono pt-1 text-xs text-muted">{order.address.phone}</div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-8">
        <Link href="/catalog" className="btn btn-primary">
          ادامه خرید
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          تماس با پشتیبانی
        </Link>
      </div>
    </div>
  );
}
