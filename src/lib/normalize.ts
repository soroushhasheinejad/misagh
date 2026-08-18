/**
 * یکسان‌سازی متن فارسی و شماره فنی برای جستجو.
 * بدون این لایه، «کیا» با «كيا» عربی و «۸۶۵۱۱» با «86511» دو چیز متفاوت‌اند.
 */

const ARABIC_TO_PERSIAN: Record<string, string> = {
  "ي": "ی",
  "ك": "ک",
  "ة": "ه",
  "ۀ": "ه",
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ؤ": "و",
  "ئ": "ی",
};

const DIGIT_MAP: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** اعراب، کشیده و نویسه‌های نامرئی */
const DIACRITICS = /[ً-ْـ‌‎‏﻿]/g;

/** متن فارسی را برای ذخیره و جستجو یکسان می‌کند. */
export function normalizeFa(input: string): string {
  let out = input.trim();
  out = out.replace(/[يكةۀأإآؤئ]/g, (ch) => ARABIC_TO_PERSIAN[ch] ?? ch);
  out = out.replace(/[۰-۹٠-٩]/g, (ch) => DIGIT_MAP[ch] ?? ch);
  out = out.replace(DIACRITICS, "");
  out = out.replace(/\s+/g, " ");
  return out.toLowerCase();
}

/**
 * شماره فنی را به شکل جستجوپذیر درمی‌آورد:
 * «86511-D9000»، «86511 d9000» و «۸۶۵۱۱D9000» همه می‌شوند «86511D9000».
 */
export function normalizePartNumber(input: string): string {
  let out = input.trim();
  out = out.replace(/[۰-۹٠-٩]/g, (ch) => DIGIT_MAP[ch] ?? ch);
  out = out.replace(/[^0-9A-Za-z]/g, "");
  return out.toUpperCase();
}

/** شکل نمایشی استاندارد شماره فنی کیا و هیوندا: پنج رقم، خط تیره، بقیه */
export function formatPartNumber(input: string): string {
  const n = normalizePartNumber(input);
  if (/^[0-9]{5}[0-9A-Z]{4,}$/.test(n)) return `${n.slice(0, 5)}-${n.slice(5)}`;
  return n;
}

/** مترادف‌های رایج فارسی برای جستجوی متنی */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  "لنت": ["لنت ترمز", "کفشک"],
  "دیسک": ["دیسک ترمز", "دیسک چرخ"],
  "کمک": ["کمک فنر", "شاک آبزوربر"],
  "طبق": ["بازویی", "طبق چرخ"],
  "فیلتر روغن": ["صافی روغن"],
  "فیلتر هوا": ["صافی هوا"],
  "شمع": ["شمع موتور"],
  "تسمه تایم": ["تسمه دینام", "تسمه"],
  "واتر پمپ": ["پمپ آب"],
  "سیبک": ["سیبک فرمان", "سیبک طبق"],
};

export function expandSynonyms(query: string): string[] {
  const q = normalizeFa(query);
  const extra = new Set<string>([q]);
  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    const nk = normalizeFa(key);
    if (q.includes(nk)) values.forEach((v) => extra.add(normalizeFa(v)));
    for (const v of values) {
      if (q.includes(normalizeFa(v))) extra.add(nk);
    }
  }
  return [...extra];
}

/**
 * تشخیص ساده مدل و سال از روی VIN برای کیا و هیوندا.
 * تا سطح «سازنده و سال» قابل اتکاست؛ رسیدن به تیپ دقیق نیاز به جدول دکد کامل دارد.
 */
const VIN_YEAR_MAP: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};

const WMI_MAKE: Record<string, string> = {
  KNA: "kia", KNB: "kia", KND: "kia", KNE: "kia", KNM: "kia", KNC: "kia",
  U5Y: "kia", U6Y: "kia",
  KMH: "hyundai", KMF: "hyundai", KMJ: "hyundai", KM8: "hyundai",
  TMA: "hyundai", NLH: "hyundai", "5NP": "hyundai", "5NM": "hyundai",
};

export type VinInfo = {
  valid: boolean;
  vin: string;
  wmi?: string;
  makeSlug?: string;
  modelYear?: number;
  error?: string;
};

export function decodeVin(raw: string): VinInfo {
  const vin = raw.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (vin.length !== 17) {
    return { valid: false, vin, error: "شماره شاسی باید ۱۷ کاراکتر باشد" };
  }
  if (/[IOQ]/.test(vin)) {
    return { valid: false, vin, error: "شماره شاسی نامعتبر است" };
  }
  const wmi = vin.slice(0, 3);
  const makeSlug = WMI_MAKE[wmi];
  const modelYear = VIN_YEAR_MAP[vin[9]];
  if (!makeSlug) {
    return { valid: true, vin, wmi, modelYear, error: "این شماره شاسی متعلق به کیا یا هیوندا نیست" };
  }
  return { valid: true, vin, wmi, makeSlug, modelYear };
}
