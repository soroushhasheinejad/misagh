import Link from "next/link";
import { notFound } from "next/navigation";
import type { SeoEntity } from "@prisma/client";
import { findTarget, previewFromTemplate } from "@/lib/seo-inventory";
import { getSeoRecord, ENTITY_LABEL, scoreSeo, scoreTone, type Slot } from "@/lib/seo-content";
import { VAR_DOCS } from "@/lib/seo-vars";
import { SeoEditor } from "@/components/SeoEditor";
import { faNumber } from "@/lib/format";
import { saveSeoContent, resetSeoContent } from "../actions";

export const dynamic = "force-dynamic";

const VALID: SeoEntity[] = ["PART", "CAR_MODEL", "CAR_CATEGORY", "CATEGORY", "PAGE"];

export default async function SeoEditPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; key?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type as SeoEntity;
  const key = sp.key ? decodeURIComponent(sp.key) : "";
  if (!VALID.includes(type) || !key) notFound();

  const [target, record, fromTemplate] = await Promise.all([
    findTarget(type, key),
    getSeoRecord(type, key),
    previewFromTemplate(type, key),
  ]);
  if (!target) notFound();

  const initial: Partial<Record<Slot, string>> = {
    metaTitle: record?.metaTitle ?? "",
    metaDescription: record?.metaDescription ?? "",
    h1: record?.h1 ?? "",
    intro: record?.intro ?? "",
    body: record?.body ?? "",
  };

  const { score, issues } = scoreSeo({
    metaTitle: record?.metaTitle,
    metaDescription: record?.metaDescription,
    intro: record?.intro,
    body: record?.body,
    keyword: target.keyword,
    internalLinks: 3,
  });
  const tone = scoreTone(score);

  const returnTo = `/admin/seo/pages?type=${type}`;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href={returnTo} className="text-xs text-muted hover:text-brass-dark">
          ← بازگشت به فهرست صفحه‌ها
        </Link>
        <h1 className="pt-3 font-display text-xl font-black">{target.label}</h1>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted">
          <span>{ENTITY_LABEL[type]}</span>
          <span dir="ltr" className="text-faint">
            {target.path}
          </span>
        </div>
      </header>

      {/* امتیاز و ایرادها */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`tnum font-display text-2xl font-black ${
              tone === "ok" ? "text-ok" : tone === "warn" ? "text-brass-dark" : "text-alert"
            }`}
          >
            {faNumber(score)}
            <span className="pr-1 text-sm font-medium text-muted">از ۱۰۰</span>
          </span>
          <span className="text-sm text-muted">
            {issues.length === 0
              ? "این صفحه از نظر محتوایی کامل است."
              : `${faNumber(issues.length)} مورد قابل بهبود`}
          </span>
        </div>

        {issues.length > 0 ? (
          <ul className="flex flex-col gap-2 pt-4">
            {issues.map((issue) => (
              <li key={issue} className="flex gap-2.5 text-sm leading-7 text-muted">
                <span className="mt-2.5 size-[5px] shrink-0 rotate-45 bg-alert" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <SeoEditor
        entityType={type}
        entityKey={key}
        label={target.label}
        path={target.path}
        initial={initial}
        fromTemplate={fromTemplate}
        noindex={record?.noindex ?? false}
        vars={VAR_DOCS[type]}
        returnTo={returnTo}
        onSave={saveSeoContent}
        onReset={resetSeoContent}
        hasRecord={Boolean(record)}
      />
    </div>
  );
}
