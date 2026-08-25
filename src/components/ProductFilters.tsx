"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

type Category = {
  id: string;
  nameFa: string;
  children: Array<{ id: string; nameFa: string }>;
};
type Brand = { id: string; nameFa: string };

/**
 * فیلترهای صفحه محصولات.
 * فرم با GET کار می‌کند تا هر ترکیب فیلتر یک آدرس قابل اشتراک‌گذاری داشته باشد؛
 * تغییر هر گزینه بلافاصله فرم را می‌فرستد.
 */
export function ProductFilters({
  categories,
  brands,
  showStockFilter = true,
}: {
  categories: Category[];
  brands: Brand[];
  /** با روشن بودن «موجودی فرضی» همه قطعات موجودند و این فیلتر معنا ندارد */
  showStockFilter?: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const current = {
    q: params.get("q") ?? "",
    categoryId: params.get("categoryId") ?? "",
    brandId: params.get("brandId") ?? "",
    generationId: params.get("generationId") ?? "",
    trimId: params.get("trimId") ?? "",
    inStock: params.get("inStock") === "1",
    hasPrice: params.get("hasPrice") === "1",
    sort: params.get("sort") ?? "newest",
  };

  const submit = () => formRef.current?.requestSubmit();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const v = String(value).trim();
      if (v) next.set(key, v);
    }
    // با تغییر فیلتر، برگشت به صفحه اول
    next.delete("page");
    router.push(`/catalog${next.toString() ? `?${next}` : ""}`);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* خودروی انتخابی از صفحه اصلی حفظ می‌شود */}
      {current.generationId ? (
        <input type="hidden" name="generationId" value={current.generationId} />
      ) : null}
      {current.trimId ? <input type="hidden" name="trimId" value={current.trimId} /> : null}

      <div>
        <label className="field-label" htmlFor="q">
          جستجو در نام یا شماره فنی
        </label>
        <div className="flex gap-2">
          <input
            id="q"
            name="q"
            defaultValue={current.q}
            placeholder="لنت جلو یا 58101"
            className="field"
          />
          <button type="submit" className="btn btn-primary px-4 py-2 text-xs">
            بگرد
          </button>
        </div>
      </div>

      <div>
        <select
          name="categoryId"
          defaultValue={current.categoryId}
          onChange={submit}
          className="field"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.nameFa}>
              <option value={c.id}>همه {c.nameFa}</option>
              {c.children.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.nameFa}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {brands.length > 0 ? (
        <div>
          <select name="brandId" defaultValue={current.brandId} onChange={submit} className="field">
            <option value="">همه برندها</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameFa}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        {showStockFilter ? (
          <label className="flex items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              name="inStock"
              value="1"
              defaultChecked={current.inStock}
              onChange={submit}
              className="size-4 accent-[var(--color-brass)]"
            />
            <span>فقط موجود در انبار</span>
          </label>
        ) : null}
        <label className="flex items-center gap-2 py-1 text-sm">
          <input
            type="checkbox"
            name="hasPrice"
            value="1"
            defaultChecked={current.hasPrice}
            onChange={submit}
            className="size-4 accent-[var(--color-brass)]"
          />
          <span>فقط قطعات دارای قیمت</span>
        </label>
      </div>

      <input type="hidden" name="sort" value={current.sort} />
    </form>
  );
}

/** نوار مرتب‌سازی بالای شبکه محصولات */
export function SortBar({ total }: { total: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const sort = params.get("sort") ?? "newest";

  const OPTIONS: Array<[string, string]> = [
    ["newest", "تازه‌ترین"],
    ["cheapest", "ارزان‌ترین"],
    ["expensive", "گران‌ترین"],
    ["name", "الفبا"],
  ];

  function change(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.delete("page");
    router.push(`/catalog?${next}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
      <div className="font-display text-sm font-bold">
        {total > 0 ? `${total.toLocaleString("fa-IR")} قطعه` : "قطعه‌ای پیدا نشد"}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-faint">ترتیب</span>
        <select
          value={sort}
          onChange={(e) => change(e.target.value)}
          className="field w-36 py-1.5 text-xs"
        >
          {OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
