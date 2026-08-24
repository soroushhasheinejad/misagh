"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col items-start px-5 py-24">
      <span className="block size-[7px] rotate-45 bg-alert" />
      <h1 className="pt-4 font-display text-2xl font-black">مشکلی در بارگذاری این صفحه پیش آمد</h1>
      <p className="max-w-lg pt-3 leading-8 text-muted">
        خطا ثبت شد و بررسی می‌شود. یک بار دیگر امتحان کنید؛ اگر باز هم تکرار شد، از راه‌های تماس
        به ما خبر بدهید.
      </p>

      {error.digest ? (
        <div className="pt-5">
          <span className="plate text-xs">{error.digest}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-8">
        <button type="button" onClick={reset} className="btn btn-primary">
          تلاش دوباره
        </button>
        <Link href="/" className="btn btn-ghost">
          صفحه اصلی
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          تماس با ما
        </Link>
      </div>
    </div>
  );
}
