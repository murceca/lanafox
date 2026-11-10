import type { ReactNode } from "react";
import { HtmlLangSync } from "../../components/HtmlLangSync";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { copy, locales } from "../../content/site";
import { assertLocale } from "../../lib/route-locale";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = assertLocale(rawLocale);
  const t = copy[locale];

  return (
    <>
      <HtmlLangSync locale={locale} />
      <a className="skipLink" href="#main-content">
        {t.skip}
      </a>
      <SiteHeader locale={locale} />
      <main id="main-content">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}

