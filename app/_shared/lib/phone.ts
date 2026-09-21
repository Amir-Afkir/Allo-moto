/** Plausibility only, not ownership verification or a country numbering database. */
export function isPlausiblePhone(value: string): boolean {
  const phone = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/^0+$/.test(digits);
}
/** Support is a French business; accept French national or international forms. */
export function supportPhoneDigits(value: string | undefined): string {
  if (!value || !isPlausiblePhone(value)) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (!value.trim().startsWith("+") && /^0[1-9]\d{8}$/.test(digits)) digits = "33" + digits.slice(1);
  return /^[1-9]\d{6,14}$/.test(digits) ? digits : "";
}
