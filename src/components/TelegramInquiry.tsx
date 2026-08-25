"use client";

import { useState } from "react";

/**
 * دکمه استعلام در تلگرام.
 *
 * تلگرام برای چت شخصی متن آماده را پر نمی‌کند (پارامتر text فقط برای ربات کار
 * می‌کند)، پس پیام را در حافظه کپی می‌کنیم و بعد چت را باز می‌کنیم؛ مشتری فقط
 * paste می‌زند. اگر مرورگر اجازه کپی نداد، پیام روی صفحه نشان داده می‌شود.
 */
export function TelegramInquiry({
  username,
  partName,
  partNumber,
  vehicle,
  className = "btn btn-ghost w-full py-2.5",
}: {
  username: string;
  partName: string;
  partNumber?: string | null;
  vehicle?: string | null;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const message = [
    "سلام، قیمت این قطعه را می‌خواستم:",
    partName,
    partNumber ? `کد فنی: ${partNumber}` : null,
    vehicle ? `خودرو: ${vehicle}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const handle = username.replace(/^@/, "");

  async function open() {
    try {
      await navigator.clipboard.writeText(message);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.open(`https://t.me/${handle}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <button type="button" onClick={open} className={className}>
        استعلام در تلگرام
      </button>

      {state === "copied" ? (
        <p className="pt-2 text-center text-xs leading-6 text-ok">
          مشخصات قطعه کپی شد؛ در تلگرام فقط paste کنید.
        </p>
      ) : null}

      {state === "failed" ? (
        <p className="pt-2 text-xs leading-6 text-muted">
          این متن را در تلگرام بفرستید:
          <span className="mt-1 block whitespace-pre-line rounded border border-line bg-steel-2 p-2 text-[0.7rem]">
            {message}
          </span>
        </p>
      ) : null}
    </div>
  );
}
