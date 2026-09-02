"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * آپلود تصویر قطعه.
 *
 * از fetch استفاده می‌کند نه اکشن سرور، چون فایل باید مستقیم به مسیر آپلود
 * برود و همان‌جا روی دیسک بنشیند. بعد از موفقیت، صفحه تازه می‌شود تا تصویر
 * تازه در فهرست بالا بیاید.
 */
export function ImageUploader({ partId }: { partId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(form: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "آپلود انجام نشد");
        return;
      }
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      action={upload}
      className="panel flex flex-wrap items-end gap-4 p-5"
      key={busy ? "busy" : "idle"}
    >
      <input type="hidden" name="partId" value={partId} />

      <label className="block flex-1 text-sm">
        <span className="field-label">انتخاب تصویر</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          className="field py-1.5 text-xs"
        />
      </label>

      <label className="block flex-1 text-sm">
        <span className="field-label">متن جایگزین</span>
        <input name="alt" placeholder="برای گوگل و کاربر نابینا" className="field" />
      </label>

      <button type="submit" disabled={busy} className="btn btn-brass px-6 disabled:opacity-50">
        {busy ? "در حال آپلود…" : "آپلود"}
      </button>

      {error ? <p className="w-full text-xs text-alert">{error}</p> : null}
    </form>
  );
}
