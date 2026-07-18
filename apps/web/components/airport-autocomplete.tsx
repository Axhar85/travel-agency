"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { airports, type Airport } from "@/data/airports";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function displayLabel(airport: Airport, locale: string): string {
  const city = locale === "es" ? airport.city.es : airport.city.en;
  return `${city} (${airport.code})`;
}

function matches(airport: Airport, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  return (
    normalize(airport.code) === q ||
    normalize(airport.code).startsWith(q) ||
    normalize(airport.city.es).includes(q) ||
    normalize(airport.city.en).includes(q) ||
    normalize(airport.country.es).includes(q) ||
    normalize(airport.country.en).includes(q) ||
    normalize(airport.name).includes(q)
  );
}

interface AirportAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (code: string) => void;
  excludeCode?: string;
}

export function AirportAutocomplete({ label, placeholder, value, onChange, excludeCode }: AirportAutocompleteProps) {
  const locale = useLocale();
  const inputId = useId();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAirport = useMemo(() => airports.find((a) => a.code === value), [value]);
  const [query, setQuery] = useState(selectedAirport ? displayLabel(selectedAirport, locale) : "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  // Typing over an existing selection clears the parent's value (see the
  // input's onChange below) - that's a self-inflicted change, not an
  // external reset (e.g. the swap-airports button, or a locale switch), so
  // the re-sync effect below must not treat it as one (otherwise it stomps
  // the character the user just typed). Refs can only be read/written in
  // effects and event handlers, not during render, hence the effect here
  // rather than the render-time-adjustment pattern used elsewhere in this
  // file.
  const selfClearedRef = useRef(false);

  useEffect(() => {
    if (selfClearedRef.current) {
      selfClearedRef.current = false;
      return;
    }
    setQuery(selectedAirport ? displayLabel(selectedAirport, locale) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedAirport is derived from value
  }, [value, locale]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!query || (selectedAirport && query === displayLabel(selectedAirport, locale))) {
      return [];
    }
    return airports.filter((a) => a.code !== excludeCode && matches(a, query)).slice(0, 8);
  }, [query, excludeCode, selectedAirport, locale]);

  function selectAirport(airport: Airport) {
    onChange(airport.code);
    setQuery(displayLabel(airport, locale));
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const airport = results[highlightedIndex];
      if (airport) selectAirport(airport);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
          if (value) {
            selfClearedRef.current = true;
            onChange("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:border-white"
      />
      {isOpen && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-64 w-full min-w-64 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {results.map((airport, index) => (
            <li key={airport.code} role="option" aria-selected={index === highlightedIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectAirport(airport)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  index === highlightedIndex ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                <span className="font-medium text-black dark:text-white">
                  {locale === "es" ? airport.city.es : airport.city.en} ({airport.code})
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {airport.name} — {locale === "es" ? airport.country.es : airport.country.en}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
