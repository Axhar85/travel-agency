const ISO_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?$/;

/** Parses an ISO 8601 duration like "PT2H30M" (as returned by Amadeus) into hours/minutes, or null if unparseable. */
export function parseIsoDuration(isoDuration: string): { hours: number; minutes: number } | null {
  const match = ISO_DURATION_PATTERN.exec(isoDuration);
  if (!match) return null;
  return {
    hours: match[1] ? Number(match[1]) : 0,
    minutes: match[2] ? Number(match[2]) : 0,
  };
}

export function formatDuration(isoDuration: string): string {
  const parsed = parseIsoDuration(isoDuration);
  if (!parsed) return isoDuration;

  const hours = parsed.hours ? `${parsed.hours}h` : "";
  const minutes = parsed.minutes ? `${parsed.minutes}m` : "";
  return [hours, minutes].filter(Boolean).join(" ") || "0m";
}

export function formatTime(isoDateTime: string, locale: string): string {
  const date = new Date(isoDateTime);
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDate(isoDateTime: string, locale: string): string {
  const date = new Date(isoDateTime);
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
}

export function formatPrice(amount: string, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(amount));
}
