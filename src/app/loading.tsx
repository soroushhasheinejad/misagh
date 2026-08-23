/** اسکلت بارگذاری — هم‌ریخت با شبکه کارت‌های کاتالوگ */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-12">
      <div className="h-3 w-28 animate-pulse rounded bg-line" />
      <div className="mt-4 h-7 w-72 max-w-full animate-pulse rounded bg-line" />

      <div className="grid gap-4 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel p-5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-line" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded bg-steel-2" />
            <div className="mt-5 h-5 w-24 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
