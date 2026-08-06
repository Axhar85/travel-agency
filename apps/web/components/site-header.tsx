"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/app/[locale]/locale-switcher";
import { getMe, logout } from "@/lib/api";
import type { User } from "@/lib/types";

interface NavLink {
  key: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { key: "flights", href: "/" },
  { key: "hotels", href: "/coming-soon" },
  { key: "hajjUmrah", href: "/hajj-umrah" },
  { key: "holidays", href: "/coming-soon" },
  { key: "offers", href: "/#promotions" },
  { key: "destinations", href: "/#destinations" },
  { key: "travelGuide", href: "/coming-soon" },
];

interface AccountLinksProps {
  user: User | null | undefined;
  onLogout: () => void;
  onNavigate?: () => void;
}

// Defined outside SiteHeader - a component declared inside another
// component's render body gets recreated (and remounted) every render.
function AccountLinks({ user, onLogout, onNavigate }: AccountLinksProps) {
  const t = useTranslations("Nav");

  if (user === undefined) return null;
  if (user === null) {
    return (
      <Link
        href="/account/login"
        onClick={onNavigate}
        className="text-sm font-medium text-zinc-700 transition-colors hover:text-primary-700 dark:text-zinc-300 dark:hover:text-primary-300"
      >
        {t("login")}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <Link
        href="/account/bookings"
        onClick={onNavigate}
        className="text-zinc-700 transition-colors hover:text-primary-700 dark:text-zinc-300 dark:hover:text-primary-300"
      >
        {user.firstName ?? user.email}
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onLogout();
        }}
        className="text-zinc-500 underline hover:text-primary-700 dark:text-zinc-400 dark:hover:text-primary-300"
      >
        {t("logout")}
      </button>
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // undefined = not checked yet (avoids flashing "log in" before the check
  // resolves), null = checked and logged out.
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Re-checks on every pathname change, not just on mount - the header
    // stays mounted across client-side navigations (Next.js App Router
    // shared layout), so without this, logging in/out on the account pages
    // would never update what the header shows until a full page reload.
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  function handleLogout() {
    void logout().then(() => {
      setUser(null);
      router.push("/");
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-primary-700 dark:text-primary-300">
          <span aria-hidden>✈</span>
          {t("logo")}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.key} href={link.href} className="transition-colors hover:text-primary-700 dark:hover:text-primary-300">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <AccountLinks user={user} onLogout={handleLogout} />
          <LocaleSwitcher />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={t("menu")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 lg:hidden"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Main mobile" className="flex flex-col gap-1 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-primary-50 dark:text-zinc-300 dark:hover:bg-primary-900/40"
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="flex flex-col gap-3 px-2 pt-2">
            <AccountLinks user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
            <div className="flex items-center gap-2 self-start rounded-full border border-accent-300 bg-accent-50 px-3 py-1.5 dark:border-accent-700 dark:bg-accent-900/30">
              <span aria-hidden>🌐</span>
              <LocaleSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
