/**
 * کروکی فنی — نمای جانبی هیوندای سوناتا، رو به چپ.
 *
 * چرا سوناتا: فرم فست‌بک آن یک خط پیوسته از سقف تا صندوق دارد و کشیدنش
 * قابل‌اتکاتر از شاسی‌بلند است که کابین جعبه‌ای دارد.
 *
 * نسبت‌های واقعی سوناتا (۴۹۰۰ × ۱۴۴۵، فاصله محور ۲۸۴۰، قطر چرخ ۷۰۰ میلی‌متر):
 *   ارتفاع = ۰.۲۹۵ طول | فاصله دو محور = ۰.۵۸ طول | چرخ = ۰.۱۴۳ طول
 *   خط کمری = ۰.۷۳ ارتفاع  ← ارتفاع کم شیشه، همان چیزی که فرم را مدرن می‌کند
 *
 * اشتباه نسخه‌های قبل: شیشه بلند و سقف صاف بود و شکل قدیمی درمی‌آمد.
 */

/** بدنه: نوک ← کاپوت ← شیشه جلو ← سقف ← خط فست‌بک ← صندوق ← سپر عقب ← قوس چرخ‌ها */
const BODY =
  "M100 323 C96 306 96 288 100 276 C104 264 112 256 124 252 L172 243 " +
  "C230 237 290 234 332 231 C342 229 348 225 354 219 L452 176 " +
  "C464 171 476 169 490 169 L556 171 C590 175 620 190 648 208 L700 224 " +
  "C716 228 730 231 742 234 C758 238 764 248 764 262 L762 323 " +
  "L695 323 A56 56 0 0 0 583 323 L289 323 A56 56 0 0 0 177 323 Z";

const WHEELS = [
  { cx: 233, cy: 330 },
  { cx: 639, cy: 330 },
];

const MONO = { font: "500 11px var(--font-mono)", letterSpacing: "0.16em" } as const;

export function CarBlueprint({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="60 150 780 288"
      className={className}
      fill="none"
      role="img"
      aria-label="کروکی نمای جانبی هیوندای سوناتا"
    >
      <defs>
        <linearGradient id="bp-ground" x1="0" x2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="bp-glass" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>

        <linearGradient id="bp-sweep" x1="0" x2="1">
          <stop offset="0" stopColor="#b4832b" stopOpacity="0" />
          <stop offset="0.5" stopColor="#e9d9b4" stopOpacity="0.5" />
          <stop offset="1" stopColor="#b4832b" stopOpacity="0" />
        </linearGradient>

        <clipPath id="bp-clip">
          <path d={BODY} />
        </clipPath>
      </defs>

      <line x1="70" y1="380" x2="830" y2="380" stroke="url(#bp-ground)" strokeWidth="1.5" />

      {/* بدنه */}
      <path
        className="bp-draw bp-d1"
        pathLength={1}
        d={BODY}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* شیشه‌ها — کم‌ارتفاع و پرشیب */}
      <g className="bp-draw bp-d2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <path pathLength={1} d="M350 226 L446 182 L446 226 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M456 181 L456 226 L524 225 L524 178 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M534 178 L616 218 L534 224 Z" fill="url(#bp-glass)" />
      </g>

      {/* خط کمری، ستون‌ها، خط طراحی بدنه */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path pathLength={1} d="M344 230 L706 222" strokeWidth="1.5" />
        <path pathLength={1} d="M452 182 L450 318" />
        <path pathLength={1} d="M530 179 L528 318" />
        <path pathLength={1} d="M346 234 L344 318" />
        <path pathLength={1} d="M296 280 C440 275 570 277 748 268" />
        <path pathLength={1} d="M300 315 L568 315" />
        <path pathLength={1} d="M470 244 h30" strokeWidth="3" />
        <path pathLength={1} d="M548 242 h30" strokeWidth="3" />
      </g>

      {/* چراغ‌ها، آینه، هواکش سپر */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <path pathLength={1} d="M112 257 L156 250 L161 265 L117 272 Z" />
        <path pathLength={1} d="M104 292 L136 287" strokeWidth="1.2" />
        <path pathLength={1} d="M726 240 L754 246 L755 261 L724 256 Z" />
        <path pathLength={1} d="M346 227 L330 221 L328 229 L344 234 Z" />
      </g>

      {/* چرخ‌ها */}
      {WHEELS.map((wheel) => (
        <g key={wheel.cx} className="bp-draw bp-d4" stroke="currentColor">
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="50" strokeWidth="2.4" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="32" strokeWidth="1.3" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="7" strokeWidth="1.3" />
          {[18, 90, 162, 234, 306].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                pathLength={1}
                x1={wheel.cx + Math.cos(rad) * 9}
                y1={wheel.cy + Math.sin(rad) * 9}
                x2={wheel.cx + Math.cos(rad) * 30}
                y2={wheel.cy + Math.sin(rad) * 30}
                strokeWidth="1.1"
              />
            );
          })}
        </g>
      ))}

      {/* نور برنجی که یک بار از روی بدنه رد می‌شود */}
      <g clipPath="url(#bp-clip)">
        <rect className="bp-sweep" x="-200" y="150" width="160" height="200" fill="url(#bp-sweep)" />
      </g>

      {/* اندازه‌گذاری فاصله دو محور */}
      <g className="bp-fade bp-d5" stroke="currentColor" strokeWidth="1" opacity="0.4">
        <line x1="233" y1="400" x2="639" y2="400" strokeDasharray="5 6" />
        <line x1="233" y1="394" x2="233" y2="406" />
        <line x1="639" y1="394" x2="639" y2="406" />
      </g>
      <text
        className="bp-fade bp-d5"
        direction="ltr"
        x="436"
        y="420"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.45"
        style={MONO}
      >
        wheelbase
      </text>

      {/* شناسه نقشه */}
      <text
        className="bp-fade bp-d5"
        direction="ltr"
        x="104"
        y="420"
        fill="currentColor"
        opacity="0.4"
        style={MONO}
      >
        hyundai sonata · side profile
      </text>

      {/* برچسب دو گروه قطعه */}
      <g className="bp-fade bp-d6" stroke="currentColor">
        <circle cx="233" cy="330" r="3.2" fill="currentColor" stroke="none" />
        <path d="M233 330 L233 362 L180 362" strokeWidth="1" opacity="0.4" />
        <text x="174" y="366" direction="ltr" textAnchor="end" fill="currentColor" stroke="none" style={MONO}>
          brakes
        </text>

        <circle cx="210" cy="240" r="3.2" fill="currentColor" stroke="none" />
        <path d="M210 240 L210 196 L162 196" strokeWidth="1" opacity="0.4" />
        <text x="156" y="200" direction="ltr" textAnchor="end" fill="currentColor" stroke="none" style={MONO}>
          engine
        </text>
      </g>
    </svg>
  );
}
