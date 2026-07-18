const ISO_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?$/;

export function formatDuration(isoDuration: string): string {
  const match = ISO_DURATION_PATTERN.exec(isoDuration);
  if (!match) return isoDuration;

  const hours = match[1] ? `${match[1]}h` : "";
  const minutes = match[2] ? `${match[2]}m` : "";
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
