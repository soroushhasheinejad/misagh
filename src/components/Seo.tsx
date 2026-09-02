import Link from "next/link";

/** درج داده ساختاریافته JSON-LD */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // داده از خود ما ساخته می‌شود، نه ورودی کاربر
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export type Crumb = { name: string; url: string };

/** مسیر راهنما — هم برای کاربر، هم برای گوگل */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر" className="flex flex-wrap items-center gap-2 text-xs text-white/40">
      {items.map((item, i) => (
        <span key={item.url + i} className="flex items-center gap-2">
          {i > 0 ? <span>/</span> : null}
          <Link href={item.url} className="hover:text-brass">
            {item.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * اسکیمای محصول.
 * قیمت نمایش داده نمی‌شود، پس به‌جای offer با قیمت، وضعیت «تماس بگیرید»
 * اعلام می‌شود — این حالت استاندارد schema.org برای فروش استعلامی است.
 */
export function productSchema(input: {
  name: string;
  description?: string | null;
  sku?: string | null;
  mpn?: string | null;
  brand?: string | null;
  url: string;
  inStock: boolean;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.mpn ? { mpn: input.mpn } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "IRR",
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      availabilityStarts: new Date().toISOString().slice(0, 10),
    },
  };
}

/** اسکیمای پرسش و پاسخ برای صفحه سوالات متداول */
export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
