import type { ReactNode } from "react";

/**
 * اجزای مشترک فرم‌های پنل.
 * صفحه‌های مدیریت زیادند و همه یک شکل فرم دارند؛ این‌ها را یک بار می‌نویسیم
 * تا هر صفحه فقط منطق خودش را داشته باشد.
 */

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-[7px] rotate-45 bg-brass" />
            <h2 className="font-display text-base font-bold">{title}</h2>
          </div>
          {hint ? (
            <p className="max-w-[68ch] pt-2 text-xs leading-6 text-faint">{hint}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  hint,
  required,
  placeholder,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">
        {label}
        {required ? <span className="pr-1 text-alert">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        required={required}
        placeholder={placeholder}
        dir={dir}
        defaultValue={
          defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)
        }
        className="field"
      />
      {hint ? <span className="block pt-1 text-[11px] leading-5 text-faint">{hint}</span> : null}
    </label>
  );
}

export function Area({
  label,
  name,
  defaultValue,
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="field w-full leading-8"
      />
      {hint ? <span className="block pt-1 text-[11px] leading-5 text-faint">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  hint,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">
        {label}
        {required ? <span className="pr-1 text-alert">*</span> : null}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="field"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <span className="block pt-1 text-[11px] leading-5 text-faint">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 shrink-0"
      />
      <span>
        {label}
        {hint ? <span className="block pt-0.5 text-[11px] leading-5 text-faint">{hint}</span> : null}
      </span>
    </label>
  );
}

/** ردیف دکمه پایین فرم */
export function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">{children}</div>
  );
}
