"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureCartToken, getCartToken } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getExchangeRates, priceOffers } from "@/lib/catalog";

/** افزودن قطعه به سبد — قیمت لحظه افزودن قفل می‌شود */
export async function addToCart(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  const qty = Math.max(1, Number(formData.get("qty")) || 1);
  if (!offerId) return;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { part: true },
  });
  if (!offer || offer.status === "DISABLED") return;

  const [settings, rates] = await Promise.all([getSettings(), getExchangeRates()]);
  const [priced] = await priceOffers(offer.part, [offer as never], { settings, rates });
  if (!priced || priced.price.kind !== "price") {
    // قطعه‌ای که قیمت ندارد از مسیر استعلام می‌رود، نه سبد
    redirect(`/inquiry?part=${encodeURIComponent(offer.part.nameFa)}`);
  }

  const token = await ensureCartToken();
  const cart = await prisma.cart.upsert({
    where: { token },
    create: { token },
    update: {},
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_offerId: { cartId: cart.id, offerId } },
  });

  const lockMinutes = Number(settings["pricing.cartLockMinutes"] ?? 30);
  const lockedUntil = new Date(Date.now() + lockMinutes * 60_000);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + qty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        offerId,
        qty,
        lockedPrice: priced.price.amountIrr,
        lockedUntil,
      },
    });
  }

  revalidatePath("/cart");
  redirect("/cart?added=1");
}

export async function updateQty(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const qty = Number(formData.get("qty"));
  if (!itemId) return;

  if (!Number.isFinite(qty) || qty < 1) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { qty: Math.trunc(qty) } });
  }
  revalidatePath("/cart");
}

export async function removeItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  revalidatePath("/cart");
}

/**
 * ثبت سفارش.
 *
 * درگاه پرداخت هنوز وصل نیست، پس سفارش با وضعیت «در انتظار تایید» ثبت می‌شود
 * و کارشناس برای هماهنگی پرداخت تماس می‌گیرد. با اتصال درگاه، همین‌جا به
 * صفحه پرداخت هدایت می‌شود.
 */
export async function placeOrder(formData: FormData) {
  const token = await getCartToken();
  if (!token) redirect("/cart");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const line = String(formData.get("address") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!fullName || !phone || !city || !line) {
    redirect("/cart?error=missing");
  }

  const cart = await prisma.cart.findUnique({
    where: { token },
    include: { items: { include: { offer: { include: { part: { include: { numbers: { where: { isPrimary: true }, take: 1 } } } } } } } },
  });
  if (!cart || cart.items.length === 0) redirect("/cart");

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, fullName },
    update: { fullName: fullName || undefined },
  });

  const address = await prisma.address.create({
    data: { userId: user.id, fullName, phone, province: province || "—", city, line },
  });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.lockedPrice ?? 0) * item.qty,
    0,
  );

  const orderNo = `M${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: user.id,
      addressId: address.id,
      status: "PENDING",
      paymentStatus: "UNPAID",
      subtotalIrr: subtotal,
      totalIrr: subtotal,
      note: note || null,
      items: {
        create: cart.items.map((item) => ({
          offerId: item.offerId,
          partId: item.offer.partId,
          titleFa: item.offer.part.nameFa,
          partNumber: item.offer.part.numbers[0]?.number ?? null,
          qty: item.qty,
          unitPrice: Number(item.lockedPrice ?? 0),
          totalPrice: Number(item.lockedPrice ?? 0) * item.qty,
        })),
      },
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  revalidatePath("/cart");
  redirect(`/order/${order.orderNo}`);
}
