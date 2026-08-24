/** قالب‌بندی عدد فارسی */

/** سال باید بدون جداکننده هزارگان نوشته شود: ۲۰۱۳ نه ۲٬۰۱۳ */
export function faYear(year: number | null | undefined): string {
  if (year === null || year === undefined) return "";
  return year.toLocaleString("fa-IR", { useGrouping: false });
}

/** بازه سال تولید */
export function faYearRange(start: number, end?: number | null): string {
  return end ? `${faYear(start)} تا ${faYear(end)}` : `${faYear(start)} به بعد`;
}

/** عدد شمارشی با جداکننده */
export function faNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}
