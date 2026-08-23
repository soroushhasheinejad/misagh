import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "خودروهای تحت پوشش",
  description: "فهرست کامل مدل‌ها و نسل‌های کیا و هیوندا که برایشان قطعه داریم، با تعداد قطعات هر نسل.",
};

export default async function VehiclesPage() {
  const makes = await prisma.vehicleMake.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      models: {
        where: { isActive: true },
        orderBy: { nameFa: "asc" },
        include: {
          generations: {
            where: { isActive: true },
            orderBy: { yearStart: "desc" },
            include: { _count: { select: { fitments: true } } },
          },
        },
      },
    },
  });

  const totalGenerations = makes.reduce(
    (sum, make) => sum + make.models.reduce((s, m) => s + m.generations.length, 0),
    0,
  );

  return (
    <div>
      <PageHeader
        eyebrow="coverage"
        title="خودروهایی که برایشان قطعه داریم"
        lede={`${totalGenerations.toLocaleString("fa-IR")} نسل از کیا و هیوندا. روی هر نسل بزنید تا قطعات سازگارش را ببینید.`}
      />

      <div className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="flex flex-col gap-12">
          {makes.map((make) => {
            const models = make.models.filter((m) => m.generations.length > 0);
            if (models.length === 0) return null;

            return (
              <section key={make.id}>
                <div className="rule pb-6">
                  <h2 className="font-display text-xl font-black">{make.nameFa}</h2>
                  <span className="rule-label">{make.nameEn}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {models.map((model) => (
                    <div key={model.id} className="panel p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-base font-bold">{model.nameFa}</h3>
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-faint">
                          {model.nameEn}
                        </span>
                      </div>

                      <ul className="pt-3">
                        {model.generations.map((gen) => (
                          <li key={gen.id} className="border-t border-line-2 py-2 first:border-t-0">
                            <Link
                              href={`/catalog?generationId=${gen.id}`}
                              className="flex items-center justify-between gap-3 text-sm hover:text-brass-dark"
                            >
                              <span>
                                {gen.nameFa}
                                <span className="tnum pr-2 text-xs text-faint">
                                  {gen.yearStart}
                                  {gen.yearEnd ? `–${gen.yearEnd}` : "+"}
                                </span>
                              </span>
                              <span className="tnum font-mono text-[0.68rem] text-faint">
                                {gen._count.fitments.toLocaleString("fa-IR")}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="panel mt-12 flex flex-wrap items-center justify-between gap-4 bg-steel-2 p-6">
          <div>
            <div className="font-display text-base font-bold">خودروی شما در فهرست نیست؟</div>
            <p className="pt-1 text-sm text-muted">
              بیشتر قطعات کیا و هیوندا را می‌توانیم تامین کنیم، حتی اگر هنوز در کاتالوگ ثبت نشده باشد.
            </p>
          </div>
          <Link href="/inquiry" className="btn btn-brass">
            درخواست قطعه
          </Link>
        </div>
      </div>
    </div>
  );
}
