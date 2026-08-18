import Link from "next/link";
import { getMakes, getCategoryTree } from "@/lib/catalog";
import { SearchPanel } from "@/components/SearchPanel";

export default async function HomePage() {
  const [makes, categories] = await Promise.all([getMakes(), getCategoryTree()]);

  return (
    <div>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold sm:text-3xl">
            قطعه خودروی خودت را دقیق پیدا کن
          </h1>
          <p className="pt-2 text-sm text-white/70">
            کیا و هیوندا — جستجو بر اساس خودرو، شماره فنی یا شماره شاسی.
          </p>
          <div className="pt-6 text-ink">
            <SearchPanel makes={makes.map((m) => ({ id: m.id, nameFa: m.nameFa }))} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="pb-4 text-lg font-bold">دسته‌بندی قطعات</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
              <Link href={`/catalog?categoryId=${c.id}`} className="font-medium hover:text-accent">
                {c.nameFa}
              </Link>
              <ul className="pt-2 text-sm text-muted">
                {c.children.slice(0, 4).map((ch) => (
                  <li key={ch.id} className="py-0.5">
                    <Link href={`/catalog?categoryId=${ch.id}`} className="hover:text-accent">
                      {ch.nameFa}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
