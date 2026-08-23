"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** ورودی شماره شاسی — شمارنده ۱۷ کاراکتری و پاک‌سازی نویسه‌های غیرمجاز */
export function VinSearchBox({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const count = clean.length;
  const complete = count === 17;
  const hasBadLetters = /[IOQ]/.test(clean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (count === 0) return;
    router.push(`/vin?vin=${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          maxLength={25}
          placeholder="KMHSH81XBBU123456"
          aria-label="شماره شاسی ۱۷ رقمی"
          className="field mono min-w-0 flex-1 py-3 text-base tracking-[0.12em]"
          dir="ltr"
        />
        <button type="submit" disabled={count === 0} className="btn btn-brass px-8 py-3 disabled:opacity-40">
          تشخیص خودرو
        </button>
      </div>

      <div className="flex h-5 items-center gap-3 pt-2 text-xs">
        <span className={complete ? "tnum text-ok" : "tnum text-faint"}>
          {count.toLocaleString("fa-IR")} از ۱۷ کاراکتر
        </span>
        {hasBadLetters ? (
          <span className="text-alert">حرف I، O و Q در شماره شاسی وجود ندارد</span>
        ) : null}
      </div>
    </form>
  );
}
