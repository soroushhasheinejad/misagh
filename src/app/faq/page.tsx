import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description: "پاسخ سوال‌های پرتکرار درباره سازگاری قطعه، قیمت، ارسال و اصالت قطعات کیا و هیوندا.",
};

const GROUPS: Array<{ title: string; hint: string; items: Array<{ q: string; a: React.ReactNode }> }> = [
  {
    title: "پیدا کردن قطعه",
    hint: "finding",
    items: [
      {
        q: "شماره فنی قطعه را ندارم، چه کنم؟",
        a: (
          <>
            خودرویتان را از نوار جستجوی صفحه اصلی انتخاب کنید تا فقط قطعات سازگار با همان خودرو را
            ببینید. اگر از نسل خودرو مطمئن نیستید،{" "}
            <Link href="/vin" className="text-brass-dark link-brass">
              شماره شاسی
            </Link>{" "}
            را وارد کنید.
          </>
        ),
      },
      {
        q: "کد قطعه‌ام قدیمی است و پیدا نمی‌شود",
        a: (
          <>
            کدهای از رده خارج به کد جایگزینشان وصل شده‌اند. همان کد قدیمی را{" "}
            <Link href="/search" className="text-brass-dark link-brass">
              جستجو کنید
            </Link>
            ؛ اگر جایگزینی ثبت شده باشد، نمایش داده می‌شود.
          </>
        ),
      },
      {
        q: "خط تیره و فاصله در شماره فنی مهم است؟",
        a: "نه. جستجو خط تیره، فاصله و اعداد فارسی را خودش یکسان می‌کند.",
      },
    ],
  },
  {
    title: "قیمت",
    hint: "pricing",
    items: [
      {
        q: "چرا بعضی قطعات قیمت ندارند؟",
        a: (
          <>
            قیمت آن قطعات به نرخ روز وابسته است و اعلام عدد قدیمی گمراه‌کننده می‌شود. برای این
            موارد{" "}
            <Link href="/inquiry" className="text-brass-dark link-brass">
              فرم استعلام
            </Link>{" "}
            را پر کنید؛ همان روز قیمت را اعلام می‌کنیم.
          </>
        ),
      },
      {
        q: "قیمت اعلام‌شده تا کی معتبر است؟",
        a: "تاریخ اعتبار کنار هر قیمت نوشته می‌شود. با ثبت سفارش، قیمت برای شما قفل می‌شود.",
      },
      {
        q: "قیمت همکار دارید؟",
        a: "بله. برای تعمیرگاه‌ها و فروشندگان قیمت جدا داریم؛ برای فعال شدن با ما تماس بگیرید.",
      },
    ],
  },
  {
    title: "کیفیت و اصالت",
    hint: "quality",
    items: [
      {
        q: "تفاوت جنیون، سازنده اصلی و های‌کپی چیست؟",
        a: (
          <>
            به‌طور خلاصه: جنیون با بسته‌بندی موبیس، سازنده اصلی همان قطعه با برند تامین‌کننده خط
            تولید، و های‌کپی ساخت کارخانه ثالث. توضیح کامل در{" "}
            <Link href="/blog/genuine-vs-high-copy" className="text-brass-dark link-brass">
              این مقاله
            </Link>
            .
          </>
        ),
      },
      {
        q: "از کجا بدانم قطعه اصل است؟",
        a: "برند و تراز کیفیت هر پیشنهاد روی سایت نوشته شده و فاکتور رسمی با همان مشخصات صادر می‌شود.",
      },
    ],
  },
  {
    title: "سفارش و ارسال",
    hint: "orders",
    items: [
      {
        q: "به شهرستان هم ارسال می‌کنید؟",
        a: (
          <>
            بله، با تیپاکس و پست پیشتاز به سراسر کشور. جزئیات در صفحه{" "}
            <Link href="/shipping" className="text-brass-dark link-brass">
              ارسال و پرداخت
            </Link>
            .
          </>
        ),
      },
      {
        q: "اگر قطعه به خودرویم نخورد چه می‌شود؟",
        a: (
          <>
            تا هفت روز، قطعه باز نشده قابل بازگشت است. شرایط کامل در صفحه{" "}
            <Link href="/returns" className="text-brass-dark link-brass">
              ضمانت و مرجوعی
            </Link>
            .
          </>
        ),
      },
      {
        q: "قطعه‌ای که می‌خواهم ناموجود است",
        a: "درخواستتان را ثبت کنید؛ بیشتر قطعات را می‌توانیم تامین کنیم و زمان تحویل را اعلام می‌کنیم.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div>
      <PageHeader
        title="سوال‌هایی که زیاد می‌پرسند"
        lede="اگر جواب سوالتان اینجا نبود، بپرسید — همان چیزی است که باید به این صفحه اضافه شود."
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="flex flex-col gap-10">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <div className="rule pb-5">
                <h2 className="font-display text-lg font-black">{group.title}</h2>
              </div>

              <div className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <details key={item.q} className="panel group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[0.95rem] font-bold marker:hidden">
                      {item.q}
                      <span className="font-mono text-brass transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="max-w-[68ch] pt-3 leading-8 text-muted">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="panel mt-12 flex flex-wrap items-center justify-between gap-4 bg-steel-2 p-6">
          <div>
            <div className="font-display text-base font-bold">جوابتان را نگرفتید؟</div>
            <p className="pt-1 text-sm text-muted">سوالتان را بپرسید، کارشناس ما پاسخ می‌دهد.</p>
          </div>
          <Link href="/contact" className="btn btn-brass">
            تماس با ما
          </Link>
        </div>
      </div>
    </div>
  );
}
