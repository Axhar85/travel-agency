// Shared style tokens for form controls/cards - not a full component library,
// just the exact className strings that were duplicated verbatim across
// every form component (search form, passenger form, admin forms). Inputs
// stay as plain <input>/<select> elements (too many different HTML types to
// unify into one React component cleanly) but share one definition of what
// "an input looks like" here instead of six copies.

// Always-light: the page background is now a fixed warm ivory regardless of
// system theme (see globals.css), so form controls/cards no longer need a
// dark: variant - only the header/footer still switch to a dark surface.
export const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500";

export const labelClass = "text-sm font-medium text-zinc-700";

export const cardClass = "rounded-2xl border border-zinc-200 bg-white shadow-sm";

// Same as cardClass but with a stronger shadow, for cards that float over a
// photo (the flight-search widget) rather than sitting on the page background.
export const searchCardClass = "rounded-2xl border border-zinc-200 bg-white shadow-lg";
