import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next.js 16 renamed the `middleware` file convention to `proxy` — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
// next-intl's exported handler has the same (request) => response signature,
// so it works unchanged as the default export here.
export default createMiddleware(routing);

export const config = {
  // Match everything except Next internals, API routes, and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
