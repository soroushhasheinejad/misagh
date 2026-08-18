/**
 * نقشه فنی دیسک و لنت ترمز — همان زبان تصویری کاتالوگ قطعات.
 * تزیین نیست: موضوع خود فروشگاه است، با خط‌های هایرلاین و اندازه‌گذاری.
 */
export function DiscDiagram({ className = "" }: { className?: string }) {
  const vents = Array.from({ length: 36 }, (_, i) => (i * 360) / 36);
  const bolts = Array.from({ length: 5 }, (_, i) => (i * 360) / 5 - 90);

  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <g stroke="currentColor" strokeWidth="1" opacity="0.85">
        {/* لبه بیرونی دیسک */}
        <circle cx="160" cy="160" r="126" />
        <circle cx="160" cy="160" r="120" opacity="0.5" />
        {/* شیارهای خنک‌کننده */}
        <g opacity="0.35">
          {vents.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                x1={160 + Math.cos(rad) * 84}
                y1={160 + Math.sin(rad) * 84}
                x2={160 + Math.cos(rad) * 118}
                y2={160 + Math.sin(rad) * 118}
              />
            );
          })}
        </g>
        {/* کاسه وسط */}
        <circle cx="160" cy="160" r="80" />
        <circle cx="160" cy="160" r="46" />
        <circle cx="160" cy="160" r="20" opacity="0.6" />
        {/* پیچ‌های چرخ */}
        {bolts.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <circle
              key={angle}
              cx={160 + Math.cos(rad) * 33}
              cy={160 + Math.sin(rad) * 33}
              r="6"
            />
          );
        })}
      </g>

      {/* لنت روی دیسک */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.7">
        <path d="M196 78 A126 126 0 0 1 262 132 L236 142 A98 98 0 0 0 186 102 Z" />
      </g>

      {/* خط اندازه‌گذاری */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.45">
        <line x1="34" y1="160" x2="286" y2="160" strokeDasharray="2 5" />
        <line x1="34" y1="152" x2="34" y2="168" />
        <line x1="286" y1="152" x2="286" y2="168" />
      </g>
      <text
        x="160"
        y="152"
        direction="ltr"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.75"
        style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.14em" }}
      >
        Ø 305 MM
      </text>
    </svg>
  );
}
