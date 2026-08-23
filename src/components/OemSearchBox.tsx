"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPartNumber, normalizePartNumber } from "@/lib/normalize";

/** ورودی شماره فنی — همان لحظه شکل استاندارد کد را نشان می‌دهد */
export function OemSearchBox({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const normalized = normalizePartNumber(value);
  const preview = normalized.length >= 5 ? formatPartNumber(normalized) : "";
  const tooShort = normalized.length > 0 && normalized.length < 3;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normalized.length < 3) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          placeholder="58101-D3A00"
          aria-label="شماره فنی قطعه"
          className="field mono min-w-0 flex-1 py-3 text-base tracking-[0.08em]"
          dir="ltr"
        />
        <button type="submit" disabled={normalized.length < 3} className="btn btn-brass px-8 py-3 disabled:opacity-40">
          جستجو
        </button>
      </div>

      <div className="h-5 pt-2 text-xs">
        {tooShort ? (
          <span className="text-alert">حداقل سه کاراکتر لازم است</span>
        ) : preview && preview !== value.trim().toUpperCase() ? (
          <span className="text-faint">
            جستجو می‌شود به‌شکل <span className="mono text-muted">{preview}</span>
          </span>
        ) : null}
      </div>
    </form>
  );
}
