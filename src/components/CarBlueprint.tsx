/**
 * کروکی فنی خودرو — نمای جانبی کراس‌اوور، رو به چپ.
 *
 * همه نقاط روی شبکه نسبت‌های استاندارد خودرو حساب شده‌اند، نه با حدس.
 * طول L=۶۵۰ و ارتفاع H=۳۰۰ روی خط زمین y=۳۸۰:
 *
 *   محور جلو ۰.۱۹L | پای ستون A ۰.۳۳L | جلوی سقف ۰.۴۲L | عقب سقف ۰.۶۶L
 *   محور عقب ۰.۷۹L | کف بدنه ۰.۲۷H | خط کمری ۰.۶۳H | کاپوت ۰.۵۵H | چرخ r=۰.۲۲H
 *
 * نکته‌ای که در نسخه‌های قبل اشتباه بود: کاپوت باید پایین‌تر از خط کمری باشد،
 * وگرنه دماغه به‌شکل گوه دراز درمی‌آید و شکل شبیه سدان قدیمی می‌شود.
 */

const BODY =
  "M116 299 C108 288 104 268 106 248 C108 228 116 218 132 214 L168 210 " +
  "C210 202 270 197 334 194 C344 192 350 186 356 178 L470 84 " +
  "C476 80 484 78 494 78 L596 80 C604 80 610 82 614 88 L700 178 " +
  "C712 190 726 196 740 199 L752 202 C776 208 790 218 792 238 L794 299 " +
  "L719 299 A72 72 0 0 0 575 299 L311 299 A72 72 0 0 0 167 299 Z";

const WHEELS = [
  { cx: 239, cy: 314 },
  { cx: 647, cy: 314 },
];

const LABEL = { font: "500 12px var(--font-mono)", letterSpacing: "0.14em" } as const;

export function CarBlueprint({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 860 420"
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
          <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
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

      <line x1="50" y1="380" x2="850" y2="380" stroke="url(#bp-ground)" strokeWidth="1.5" />

      {/* بدنه */}
      <path
        className="bp-draw bp-d1"
        pathLength={1}
        d={BODY}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* شیشه‌ها — شیب تند جلو و عقب، همان چیزی که فرم را مدرن می‌کند */}
      <g className="bp-draw bp-d2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path pathLength={1} d="M374 176 L466 90 L466 176 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M476 90 L476 176 L538 175 L538 88 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M548 88 L548 175 L598 174 L598 84 Z" fill="url(#bp-glass)" />
        <path pathLength={1} d="M606 88 L688 172 L606 174 Z" fill="url(#bp-glass)" />
      </g>

      {/* خط کمری، ستون‌ها، خط طراحی بدنه */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
        <path pathLength={1} d="M358 184 L700 176" strokeWidth="1.5" />
        <path pathLength={1} d="M470 90 L468 294" />
        <path pathLength={1} d="M542 88 L540 294" />
        <path pathLength={1} d="M602 86 L600 294" />
        <path pathLength={1} d="M360 190 L358 294" />
        <path pathLength={1} d="M300 244 C450 238 600 240 770 232" />
        <path pathLength={1} d="M300 288 L580 288" />
        <path pathLength={1} d="M490 202 h36" strokeWidth="3.5" />
        <path pathLength={1} d="M556 200 h36" strokeWidth="3.5" />
      </g>

      {/* چراغ‌ها، آینه، هواکش سپر */}
      <g className="bp-draw bp-d3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path pathLength={1} d="M114 214 L166 207 L175 226 L122 233 Z" />
        <path pathLength={1} d="M106 246 L142 241" strokeWidth="1.25" />
        <path pathLength={1} d="M764 204 L788 210 L789 230 L762 224 Z" />
        <path pathLength={1} d="M358 182 L338 175 L335 186 L354 193 Z" />
      </g>

      {/* چرخ‌ها */}
      {WHEELS.map((wheel) => (
        <g key={wheel.cx} className="bp-draw bp-d4" stroke="currentColor">
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="66" strokeWidth="2.5" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="42" strokeWidth="1.4" />
          <circle pathLength={1} cx={wheel.cx} cy={wheel.cy} r="9" strokeWidth="1.4" />
          {[18, 90, 162, 234, 306].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                pathLength={1}
                x1={wheel.cx + Math.cos(rad) * 11}
                y1={wheel.cy + Math.sin(rad) * 11}
                x2={wheel.cx + Math.cos(rad) * 40}
                y2={wheel.cy + Math.sin(rad) * 40}
                strokeWidth="1.2"
              />
            );
          })}
        </g>
      ))}

      {/* نور برنجی که یک بار از روی بدنه رد می‌شود */}
      <g clipPath="url(#bp-clip)">
        <rect className="bp-sweep" x="-240" y="60" width="180" height="250" fill="url(#bp-sweep)" />
      </g>

      {/* اندازه‌گذاری فاصله دو محور */}
      <g className="bp-fade bp-d5" stroke="currentColor" strokeWidth="1" opacity="0.4">
        <line x1="239" y1="396" x2="647" y2="396" strokeDasharray="5 6" />
        <line x1="239" y1="390" x2="239" y2="402" />
        <line x1="647" y1="390" x2="647" y2="402" />
      </g>
      <text
        className="bp-fade bp-d5"
        x="443"
        y="414"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.45"
        style={{ font: "500 11.5px var(--font-mono)", letterSpacing: "0.2em" }}
      >
        wheelbase
      </text>

      {/* برچسب دو گروه قطعه */}
      <g className="bp-fade bp-d6" stroke="currentColor">
        <circle cx="239" cy="314" r="3.5" fill="currentColor" stroke="none" />
        <path d="M239 314 L239 354 L180 354" strokeWidth="1" opacity="0.4" />
        <text x="174" y="358" textAnchor="end" fill="currentColor" stroke="none" style={LABEL}>
          brakes
        </text>

        <circle cx="205" cy="205" r="3.5" fill="currentColor" stroke="none" />
        <path d="M205 205 L205 150 L155 150" strokeWidth="1" opacity="0.4" />
        <text x="149" y="154" textAnchor="end" fill="currentColor" stroke="none" style={LABEL}>
          engine
        </text>
      </g>
    </svg>
  );
}
