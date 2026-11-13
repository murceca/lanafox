import { copy, href, locales, slugs, type Locale, type Slug } from "../content/site";

export interface PageMetadata {
  title: string;
  description: string;
  metadataBase: URL;
  alternates: {
    canonical: string;
    languages: {
      en: string;
      uk: string;
      "x-default": string;
    };
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: "website";
    images: { url: string; width: number; height: number }[];
  };
  robots: {
    index: boolean;
    follow: boolean;
  };
}

export function publicOrigin() {
  const value = process.env.SITE_ORIGIN || "https://lanafox.eu";
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("SITE_ORIGIN must be an HTTPS origin");
  return url.origin;
}

export function metadataFor(locale: Locale, slug: Slug): PageMetadata {
  const t = copy[locale];
  const label =
    slug === "portfolio"
      ? t.portfolio
      : slug === "contact"
        ? t.contact
        : slug === "privacy-policy"
          ? t.privacy
          : slug === "terms-and-conditions"
            ? t.terms
            : t.photography;
  const title = `${label} | Lana Fox`;
  const description =
    slug === "" ? t.intro : `${label} — Lana Fox. ${t.photography}.`;
  const origin = publicOrigin();
  return {
    title,
    description,
    metadataBase: new URL(origin),
    alternates: {
      canonical: origin + href(locale, slug),
      languages: {
        en: origin + href("en", slug),
        uk: origin + href("uk", slug),
        "x-default": origin + href("en", slug),
      },
    },
    openGraph: {
      title,
      description,
      url: origin + href(locale, slug),
      siteName: "Lana Fox",
      locale: locale === "uk" ? "uk_UA" : "en_GB",
      type: "website",
      images: [
        {
          url: origin + "/images/carousel-images/pic1.jpeg",
          width: 1920,
          height: 990,
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export function buildSitemap() {
  const origin = publicOrigin();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({
      url: origin + href(locale, slug),
      alternates: {
        languages: {
          en: origin + href("en", slug),
          uk: origin + href("uk", slug),
          "x-default": origin + href("en", slug),
        },
      },
    })),
  );
}

export function buildRobots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: publicOrigin() + "/sitemap.xml",
  };
}

