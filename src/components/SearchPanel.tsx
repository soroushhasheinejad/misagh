"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; nameFa: string; yearStart?: number; yearEnd?: number | null };
type Tab = "vehicle" | "oem" | "vin";

const TABS: Array<{ key: Tab; label: string; hint: string }> = [
  { key: "vehicle", label: "خودرو", hint: "vehicle" },
  { key: "oem", label: "شماره فنی", hint: "oem" },
  { key: "vin", label: "شماره شاسی", hint: "vin" },
];

async function fetchLevel(query: string): Promise<Option[]> {
  const response = await fetch(`/api/vehicles?level=${query}`);
  if (!response.ok) return [];
  return response.json();
}

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        value={value}
        disabled={disabled || options.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      >
        <option value="">{disabled ? "—" : "انتخاب کنید"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nameFa}
            {o.yearStart ? ` (${o.yearStart}${o.yearEnd ? `–${o.yearEnd}` : " به بعد"})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchPanel({ makes }: { makes: Option[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("vehicle");

  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [trimId, setTrimId] = useState("");

  const [models, setModels] = useState<Option[]>([]);
  const [generations, setGenerations] = useState<Option[]>([]);
  const [trims, setTrims] = useState<Option[]>([]);

  const [oem, setOem] = useState("");
  const [vin, setVin] = useState("");

  /** هر سطح که عوض شود، سطح‌های پایین‌تر پاک و دوباره خوانده می‌شوند. */
  async function pickMake(value: string) {
    setMakeId(value);
    setModelId("");
    setGenerationId("");
    setTrimId("");
    setGenerations([]);
    setTrims([]);
    setModels(value ? await fetchLevel(`models&makeId=${value}`) : []);
  }

  async function pickModel(value: string) {
    setModelId(value);
    setGenerationId("");
    setTrimId("");
    setTrims([]);
    setGenerations(value ? await fetchLevel(`generations&modelId=${value}`) : []);
  }

  async function pickGeneration(value: string) {
    setGenerationId(value);
    setTrimId("");
    setTrims(value ? await fetchLevel(`trims&generationId=${value}`) : []);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "vehicle" && generationId) {
      const params = new URLSearchParams({ generationId });
      if (trimId) params.set("trimId", trimId);
      router.push(`/catalog?${params}`);
    } else if (tab === "oem" && oem.trim()) {
      router.push(`/search?q=${encodeURIComponent(oem.trim())}`);
    } else if (tab === "vin" && vin.trim()) {
      router.push(`/vin?vin=${encodeURIComponent(vin.trim())}`);
    }
  }

  const canSubmit =
    (tab === "vehicle" && !!generationId) ||
    (tab === "oem" && oem.trim().length > 2) ||
    (tab === "vin" && vin.trim().length > 5);

  return (
    <div className="panel panel-brass shadow-[0_18px_40px_-28px_rgba(14,20,27,0.55)]">
      {/* انتخاب مسیر جستجو */}
      <div className="flex border-b border-line-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "relative flex-1 px-4 py-3 font-display text-sm font-bold text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-brass"
                : "flex-1 px-4 py-3 font-display text-sm font-medium text-faint transition-colors hover:text-muted"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="p-5">
        {tab === "vehicle" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            <div className="lg:pl-5">
              <Select label="برند" value={makeId} options={makes} onChange={pickMake} />
            </div>
            <div className="lg:border-r lg:border-line-2 lg:px-5">
              <Select label="مدل" value={modelId} options={models} onChange={pickModel} disabled={!makeId} />
            </div>
            <div className="lg:border-r lg:border-line-2 lg:px-5">
              <Select label="نسل و سال" value={generationId} options={generations} onChange={pickGeneration} disabled={!modelId} />
            </div>
            <div className="lg:border-r lg:border-line-2 lg:pr-5">
              <Select label="تیپ موتور" value={trimId} options={trims} onChange={setTrimId} disabled={!generationId} />
            </div>
          </div>
        ) : tab === "oem" ? (
          <div>
            <span className="field-label">شماره فنی روی جعبه یا خود قطعه</span>
            <input
              value={oem}
              onChange={(e) => setOem(e.target.value)}
              placeholder="58101-D3A00"
              className="field mono text-center text-lg tracking-[0.14em]"
            />
            <p className="pt-2 text-xs text-faint">
              خط تیره و فاصله مهم نیست. کدهای معادل و کدهای جایگزین‌شده هم می‌آیند.
            </p>
          </div>
        ) : (
          <div>
            <span className="field-label">شماره شاسی ۱۷ رقمی</span>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="KNAPB81ABJ5000000"
              className="field mono text-center tracking-[0.18em]"
            />
            <p className="pt-2 text-xs text-faint">
              برند و سال ساخت از روی شماره شاسی خوانده می‌شود.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-5">
          <p className="hidden text-xs text-faint sm:block">
            {tab === "vehicle"
              ? "بعد از انتخاب، فقط قطعات سازگار با همین خودرو را می‌بینید."
              : tab === "oem"
                ? "یک کد وارد کنید، همه معادل‌هایش را نشان می‌دهیم."
                : "تا سطح مدل و سال تشخیص داده می‌شود."}
          </p>
          <button type="submit" disabled={!canSubmit} className="btn btn-brass disabled:opacity-40">
            جستجو
          </button>
        </div>
      </form>
    </div>
  );
}
