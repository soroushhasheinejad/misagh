/** سربرگ مشترک صفحات داخلی — نوار کربنی با برچسب مونو و تیتر منشور */
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <section className="border-b border-brass/25 bg-carbon py-12 text-white">
      <div className="mx-auto max-w-[1120px] px-5">
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-brass">
          {eyebrow}
        </div>
        <h1 className="max-w-2xl pt-4 font-display text-3xl font-black leading-[1.5]">{title}</h1>
        {lede ? <p className="max-w-xl pt-3 leading-8 text-white/60">{lede}</p> : null}
      </div>
    </section>
  );
}
