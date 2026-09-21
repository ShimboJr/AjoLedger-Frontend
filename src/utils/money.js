/**
 * Money utilities — client side.
 * All values from the API are in kobo (integers).
 * These helpers convert at the display edge only.
 */

/**
 * toKobo(naira) — convert naira number to kobo integer.
 */
export function toKobo(naira) {
  return Math.round(Number(naira) * 100);
}

/**
 * toNaira(kobo) — convert kobo integer to naira number.
 */
export function toNaira(kobo) {
  return Number(kobo) / 100;
}

/**
 * formatNaira(kobo) — display string like ₦20,000 using the naira sign.
 */
export function formatNaira(kobo) {
  const naira = toNaira(kobo);
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * formatNairaInput(naira) — formats a naira number for display in an input.
 * Returns a plain number string (no symbol), for controlled inputs.
 */
export function formatNairaInput(naira) {
  return naira != null ? String(naira) : '';
}
