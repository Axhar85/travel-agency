import { defineRouting } from 'next-intl/routing';

// Spanish is the primary language (Madrid-based agency); English is secondary.
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
});
