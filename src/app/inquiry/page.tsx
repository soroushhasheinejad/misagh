import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

async function submitInquiry(formData: FormData) {
  "use server";
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  await prisma.inquiry.create({
    data: {
      phone,
      fullName: String(formData.get("fullName") ?? "") || null,
      vehicleText: String(formData.get("vehicleText") ?? "") || null,
      partText: String(formData.get("partText") ?? "") || null,
      partNumber: String(formData.get("partNumber") ?? "") || null,
      channel: "SITE",
    },
  });

  redirect("/inquiry?sent=1");
}

export default async function InquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ part?: string; pn?: string; sent?: string }>;
}) {
  const { part, pn, sent } = await searchParams;
  const settings = await getSettings();

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-ok">درخواست شما ثبت شد</h1>
        <p className="pt-2 text-sm text-muted">
          کارشناسان ما قیمت و موجودی را بررسی می‌کنند و به‌زودی تماس می‌گیرند.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-lg font-bold">استعلام قیمت / درخواست قطعه</h1>
      <p className="pt-1 text-sm text-muted">
        مشخصات خودرو و قطعه را بنویسید؛ قیمت و موجودی را برایتان استعلام می‌کنیم.
      </p>

      <form action={submitInquiry} className="mt-6 flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">شماره تماس *</span>
          <input name="phone" required placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="w-full rounded border border-line px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">نام و نام خانوادگی</span>
          <input name="fullName" className="w-full rounded border border-line px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">خودرو (برند، مدل، سال)</span>
          <input name="vehicleText" placeholder="مثال: کیا اسپورتیج ۲۰۱۸" className="w-full rounded border border-line px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">قطعه مورد نیاز</span>
          <input name="partText" defaultValue={part ?? ""} className="w-full rounded border border-line px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted">شماره فنی (اگر دارید)</span>
          <input name="partNumber" defaultValue={pn ?? ""} className="pn w-full rounded border border-line px-3 py-2 text-sm" />
        </label>

        <button type="submit" className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark">
          ثبت درخواست
        </button>

        {settings["inquiry.whatsappNumber"] || settings["inquiry.telegramUsername"] ? (
          <p className="text-xs text-faint">
            یا مستقیم پیام بدهید:{" "}
            {settings["inquiry.whatsappNumber"] ? `واتساپ ${settings["inquiry.whatsappNumber"]}` : ""}{" "}
            {settings["inquiry.telegramUsername"] ? `تلگرام @${settings["inquiry.telegramUsername"]}` : ""}
          </p>
        ) : null}
      </form>
    </div>
  );
}
