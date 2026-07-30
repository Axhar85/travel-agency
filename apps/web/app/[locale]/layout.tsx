import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const nav = await getTranslations({ locale, namespace: "Nav" });

  // title.default applies to any page that doesn't set its own title (most
  // of the site); title.template applies the "<page> | Naafi Travels"
  // suffix to any page that DOES set one (e.g. hajj-umrah). Same for
  // description/openGraph - pages can override, everything else inherits
  // these as sensible defaults rather than every page needing its own copy.
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${nav("logo")} — ${t("title")}`,
      template: `%s | ${nav("logo")}`,
    },
    description: t("subtitle"),
    openGraph: {
      siteName: nav("logo"),
      title: `${nav("logo")} — ${t("title")}`,
      description: t("subtitle"),
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1687992176093-6417a93fa3d0?auto=format&fit=crop&w=1200&q=75",
          width: 1200,
          height: 630,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this locale (see next-intl docs).
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <CookieConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
