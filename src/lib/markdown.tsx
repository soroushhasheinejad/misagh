import Link from "next/link";
import type { ReactNode } from "react";

/**
 * مبدل مارک‌داون به المان‌های ری‌اکت.
 * فقط زیرمجموعه‌ای که در مقاله‌ها استفاده می‌شود پشتیبانی می‌شود، و چون خروجی
 * المان است نه رشته HTML، جای تزریق کد باقی نمی‌ماند.
 *
 * پشتیبانی: ## و ### | پاراگراف | - فهرست | ۱. فهرست شماره‌دار | > نقل‌قول
 *           | --- جداکننده | **پررنگ** | `کد` | [متن](لینک)
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-display font-bold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="plate text-[0.8em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const [, label, href] = token.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      nodes.push(
        <Link key={key} href={href} className="text-brass-dark link-brass">
          {label}
        </Link>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p-${key++}`} className="pb-5 leading-9 text-muted">
        {inline(paragraph.join(" "), `p${key}`)}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l-${key++}`}
        className={
          list.ordered
            ? "list-decimal space-y-2 pb-6 pr-6 leading-8 text-muted marker:font-mono marker:text-brass"
            : "list-disc space-y-2 pb-6 pr-6 leading-8 text-muted marker:text-brass"
        }
      >
        {list.items.map((item, idx) => (
          <li key={idx}>{inline(item, `li${key}-${idx}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote
        key={`q-${key++}`}
        className="mb-6 border-r-[3px] border-brass bg-brass-soft/60 px-5 py-4 leading-8 text-ink"
      >
        {inline(quote.join(" "), `q${key}`)}
      </blockquote>,
    );
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushAll();
      continue;
    }

    if (line === "---") {
      flushAll();
      blocks.push(<hr key={`hr-${key++}`} className="my-8 border-line" />);
      continue;
    }

    if (line.startsWith("### ")) {
      flushAll();
      blocks.push(
        <h3 key={`h3-${key++}`} className="pb-3 pt-4 font-display text-base font-bold">
          {line.slice(4)}
        </h3>,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      blocks.push(
        <h2 key={`h2-${key++}`} className="pb-4 pt-8 font-display text-xl font-black">
          {line.slice(3)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();
  return <div className="max-w-[68ch]">{blocks}</div>;
}
