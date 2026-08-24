/** سربرگ مشترک صفحات داخلی — نوار کربنی با نشان برنجی و تیتر منشور */
export function PageHeader({ title, lede }: { title: string; lede?: string }) {
  return (
    <section className="border-b border-brass/25 bg-carbon py-12 text-white">
      <div className="mx-auto max-w-[1120px] px-5">
        <span className="block size-[7px] rotate-45 bg-brass" />
        <h1 className="max-w-2xl pt-6 font-display text-3xl font-black leading-[1.5]">{title}</h1>
        {lede ? <p className="max-w-xl pt-3 leading-8 text-white/60">{lede}</p> : null}
      </div>
    </section>
  );
}
