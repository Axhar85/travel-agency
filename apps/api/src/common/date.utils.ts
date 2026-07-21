/**
 * UTC-based date helpers. Comparing dates via server-local `Date` methods
 * (setHours, getDate, etc.) makes validation results depend on the server's
 * configured timezone — a date-only string like "2026-08-01" is parsed as
 * UTC midnight per the ECMAScript spec, so "today" must be computed the
 * same way to compare like with like.
 */

export function todayUtcMidnight(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Returns the parsed timestamp, or null if `value` isn't a valid date string. */
export function parseUtcTimestamp(value: string): number | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}
