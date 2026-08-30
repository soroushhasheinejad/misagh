import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { CallInquiry } from "@/components/CallInquiry";

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
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="mx-auto block size-[7px] rotate-45 bg-ok" />
        <h1 className="pt-4 font-display text-xl font-black">درخواست شما ثبت شد</h1>
        <p className="pt-3 text-sm text-muted">
          قیمت و موجودی را بررسی می‌کنیم و با همان شماره تماس می‌گیریم.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="rule pb-5">
            <h1 className="font-display text-xl font-black">استعلام قیمت</h1>
          </div>
          <p className="max-w-lg text-muted">
            قطعه‌ای که دنبالش هستید در سایت نیست یا قیمتش اعلام نشده؟ مشخصات را بنویسید؛ کارشناس ما
            قیمت و موجودی را استعلام می‌کند.
          </p>

          {/* اگر عجله دارند، تماس مستقیم سریع‌تر از فرم است */}
          <div className="panel mt-6 p-5">
            <CallInquiry
              phones={[settings["store.phone"], settings["store.phone2"]]
                .map((v) => String(v ?? "").trim())
                .filter(Boolean)}
              hours={String(settings["store.callHours"] ?? "") || undefined}
              variant="inline"
            />
            <p className="pt-3 text-xs leading-6 text-faint">
              برای جواب فوری تماس بگیرید؛ فرم پایین وقتی به‌درد می‌خورد که عجله ندارید و
              می‌خواهید درخواستتان ثبت و پیگیری شود.
            </p>
          </div>

          <form action={submitInquiry} className="panel panel-brass mt-6 flex flex-col gap-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">شماره تماس *</span>
                <input name="phone" required placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="field" />
              </label>
              <label className="block">
                <span className="field-label">نام و نام خانوادگی</span>
                <input name="fullName" className="field" />
              </label>
            </div>

            <label className="block">
              <span className="field-label">خودرو — برند، مدل و سال</span>
              <input name="vehicleText" placeholder="کیا اسپورتیج ۲۰۱۸ تیپ ۲.۴" className="field" />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">قطعه مورد نیاز</span>
                <input name="partText" defaultValue={part ?? ""} className="field" />
              </label>
              <label className="block">
                <span className="field-label">شماره فنی، اگر دارید</span>
                <input
                  name="partNumber"
                  defaultValue={pn ?? ""}
                  placeholder="58101-D3A00"
                  className="field mono tracking-[0.1em]"
                />
              </label>
            </div>

            <button type="submit" className="btn btn-brass self-start">
              ثبت درخواست
            </button>
          </form>
        </div>

        <aside className="lg:pt-16">
          <div className="panel bg-carbon p-6 text-white">
                        <h2 className="pt-3 font-display text-base font-bold">ترجیح می‌دهید پیام بدهید؟</h2>
            <p className="pt-2 text-sm leading-7 text-white/60">
              عکس قطعه یا شماره فنی را بفرستید؛ همان‌جا قیمت می‌دهیم.
            </p>
            <div className="flex flex-wrap gap-2 pt-4">
              {settings["inquiry.whatsappNumber"] ? (
                <a
                  href={`https://wa.me/${settings["inquiry.whatsappNumber"]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-brass px-4 py-2 text-xs"
                >
                  واتساپ
                </a>
              ) : null}
              {settings["inquiry.telegramUsername"] ? (
                <a
                  href={`https://t.me/${settings["inquiry.telegramUsername"]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn px-4 py-2 text-xs text-white ring-1 ring-white/25 hover:bg-white/10"
                >
                  تلگرام
                </a>
              ) : null}
              {!settings["inquiry.whatsappNumber"] && !settings["inquiry.telegramUsername"] ? (
                <p className="text-xs text-white/40">
                  شماره واتساپ و تلگرام هنوز در پنل مدیریت ثبت نشده است.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
