/**
 * Date utilities — client side.
 * All dates from the API are ISO UTC strings.
 * Display in Africa/Lagos timezone (WAT, UTC+1, no DST).
 */

const LAGOS_TZ = 'Africa/Lagos';

const DATE_FORMAT = new Intl.DateTimeFormat('en-NG', {
  timeZone: LAGOS_TZ,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('en-NG', {
  timeZone: LAGOS_TZ,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-NG', {
  timeZone: LAGOS_TZ,
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * formatDate(dateish) — e.g. "21 Sep 2026"
 */
export function formatDate(dateish) {
  if (!dateish) return '—';
  return DATE_FORMAT.format(new Date(dateish));
}

/**
 * formatDateTime(dateish) — e.g. "21 Sep 2026, 11:00 PM"
 */
export function formatDateTime(dateish) {
  if (!dateish) return '—';
  return DATETIME_FORMAT.format(new Date(dateish));
}

/**
 * formatTime(dateish) — e.g. "11:00 PM"
 */
export function formatTime(dateish) {
  if (!dateish) return '—';
  return TIME_FORMAT.format(new Date(dateish));
}

/**
 * isOverdue(dateish) — returns true if the date is in the past.
 */
export function isOverdue(dateish) {
  if (!dateish) return false;
  return new Date(dateish) < new Date();
}

/**
 * relativeDays(dateish) — e.g. "in 3 days" or "2 days ago"
 */
export function relativeDays(dateish) {
  if (!dateish) return '';
  const diff = Math.round((new Date(dateish) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff > 0) return `in ${diff} day${diff !== 1 ? 's' : ''}`;
  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`;
}
