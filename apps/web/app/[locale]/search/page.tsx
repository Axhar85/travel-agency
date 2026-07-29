import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SearchResults } from "@/components/search-results";

// Dynamic, per-query results page - not stable content worth indexing.
export const metadata: Metadata = { robots: { index: false, follow: false } };

function toStringParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toIntParam(value: string | string[] | undefined, fallback: number): number {
  const raw = toStringParam(value);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;

  const origin = toStringParam(query.origin) ?? "";
  const destination = toStringParam(query.destination) ?? "";
  const departureDate = toStringParam(query.departureDate) ?? "";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <SearchResults
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        returnDate={toStringParam(query.returnDate)}
        adults={toIntParam(query.adults, 1)}
        childCount={toIntParam(query.children, 0) || undefined}
        infants={toIntParam(query.infants, 0) || undefined}
        cabinClass={toStringParam(query.cabinClass)}
      />
    </div>
  );
}
