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
  "L703 323 A64 64 0 0 0 575 323 L297 323 A64 64 0 0 0 169 323 Z";

const WHEELS = [
  { cx: 233, cy: 330 },
  { cx: 639, cy: 330 },
];

export function CarBlueprint({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="72 152 758 264"
      className={className}
      fill="none"
      role="img"
      aria-label="کروکی نمای جانبی خودرو"
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
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* شیشه‌ها — کم‌ارتفاع و پرشیب */}
      <g className="bp-draw bp-d2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <path pathLength={1} d="M350 226 L446 182 L446 226 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M456 181 L456 226 L524 225 L524 178 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M536 178 L592 210 L536 223 Z" fill="url(#bp-glass)" />
      </g>

      {/* قاب کرومی شیشه با شکست ستون عقب، ستون‌ها، و خط طراحی «فلویدیک» */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        {/* قاب کرومی: از پایه شیشه جلو تا ستون عقب و شکست رو به بالا */}
        {/* ستون‌ها */}
        <path pathLength={1} d="M452 182 L451 308" />
        <path pathLength={1} d="M530 179 L529 308" />
        <path pathLength={1} d="M347 232 L345 308" />
        {/* خط طراحی امضای YF: از قوس چرخ جلو بالا می‌رود و تا چراغ عقب می‌رسد */}
        <path pathLength={1} d="M306 272 C430 268 550 268 690 262" strokeWidth="1" />
        {/* کرام پایین درب */}
        <path pathLength={1} d="M300 312 C420 310 500 310 568 308" strokeWidth="0.9" opacity="0.75" />
        {/* دستگیره‌ها */}
        <path pathLength={1} d="M472 250 h28" strokeWidth="2.6" />
        <path pathLength={1} d="M550 247 h28" strokeWidth="2.6" />
      </g>

      {/* چراغ جلوی کشیده تا داخل گلگیر، جلوپنجره شش‌ضلعی، چراغ عقب، آینه */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <path pathLength={1} d="M108 258 C130 252 152 248 176 246 L184 258 C160 262 132 268 114 272 Z" />
        <path pathLength={1} d="M100 280 L104 296 L134 292 L132 277 Z" strokeWidth="1.2" />
        <path pathLength={1} d="M726 238 C740 240 750 243 756 246 L757 262 C746 260 734 258 724 256 Z" />
        <path pathLength={1} d="M346 227 L328 220 L326 229 L344 234 Z" />
      </g>

      {/* چرخ‌ها */}
      {WHEELS.map((wheel) => (
        <g key={wheel.cx} className="bp-draw bp-d4" stroke="currentColor">
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="50" strokeWidth="2.4" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="34" strokeWidth="1.2" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="7" strokeWidth="1.3" />
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                pathLength={1}
                x1={wheel.cx + Math.cos(rad) * 9}
                y1={wheel.cy + Math.sin(rad) * 9}
                x2={wheel.cx + Math.cos(rad) * 30}
                y2={wheel.cy + Math.sin(rad) * 30}
                strokeWidth="0.9"
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
        <line x1="233" y1="398" x2="639" y2="398" strokeDasharray="4 7" />
        <line x1="233" y1="392" x2="233" y2="404" />
        <line x1="639" y1="392" x2="639" y2="404" />
      </g>
    </svg>
  );
}
