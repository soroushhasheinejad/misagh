"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; nameFa: string; yearStart?: number; yearEnd?: number | null };
type Tab = "vehicle" | "oem" | "vin";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "vehicle", label: "جستجو بر اساس خودرو" },
  { key: "oem", label: "شماره فنی" },
  { key: "vin", label: "شماره شاسی (VIN)" },
];

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
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select
        value={value}
        disabled={disabled || options.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-line bg-surface px-3 py-2 text-sm disabled:bg-surface-2 disabled:text-faint"
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

  useEffect(() => {
    setModelId("");
    setGenerations([]);
    setTrims([]);
    if (!makeId) return setModels([]);
    fetch(`/api/vehicles?level=models&makeId=${makeId}`)
      .then((r) => r.json())
      .then(setModels);
  }, [makeId]);

  useEffect(() => {
    setGenerationId("");
    setTrims([]);
    if (!modelId) return setGenerations([]);
    fetch(`/api/vehicles?level=generations&modelId=${modelId}`)
      .then((r) => r.json())
      .then(setGenerations);
  }, [modelId]);

  useEffect(() => {
    setTrimId("");
    if (!generationId) return setTrims([]);
    fetch(`/api/vehicles?level=trims&generationId=${generationId}`)
      .then((r) => r.json())
      .then(setTrims);
  }, [generationId]);

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

  return (
    <div className="rounded-lg border border-line bg-surface shadow-sm">
      <div className="flex flex-wrap gap-1 border-b border-line p-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded bg-accent px-3 py-2 text-sm font-medium text-white"
                : "rounded px-3 py-2 text-sm text-muted hover:bg-surface-2"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="p-4">
        {tab === "vehicle" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="برند" value={makeId} options={makes} onChange={setMakeId} />
            <Select label="مدل" value={modelId} options={models} onChange={setModelId} disabled={!makeId} />
            <Select label="نسل / سال" value={generationId} options={generations} onChange={setGenerationId} disabled={!modelId} />
            <Select label="تیپ موتور" value={trimId} options={trims} onChange={setTrimId} disabled={!generationId} />
          </div>
        ) : tab === "oem" ? (
          <div>
            <label className="mb-1 block text-xs text-muted">شماره فنی قطعه</label>
            <input
              value={oem}
              onChange={(e) => setOem(e.target.value)}
              placeholder="مثال: 58101-D3A00"
              className="pn w-full rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <p className="pt-2 text-xs text-faint">
              خط تیره و فاصله مهم نیست؛ کدهای معادل و جایگزین هم نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs text-muted">شماره شاسی ۱۷ رقمی</label>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="KNAPB81ABJ5000000"
              className="pn w-full rounded border border-line bg-surface px-3 py-2 text-sm"
            />
            <p className="pt-2 text-xs text-faint">
              از روی VIN، برند و سال ساخت خودرو تشخیص داده می‌شود.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark sm:w-auto sm:px-8"
        >
          جستجو
        </button>
      </form>
    </div>
  );
}
