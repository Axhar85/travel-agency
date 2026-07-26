// Shared style tokens for form controls/cards - not a full component library,
// just the exact className strings that were duplicated verbatim across
// every form component (search form, passenger form, admin forms). Inputs
// stay as plain <input>/<select> elements (too many different HTML types to
// unify into one React component cleanly) but share one definition of what
// "an input looks like" here instead of six copies.

export const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-primary-400 dark:focus:ring-primary-400";

export const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const cardClass =
  "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
