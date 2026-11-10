"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { copy, href, site, type Locale, type Slug } from "../content/site";
import { getImageDimensions } from "../lib/local-images";
import styles from "./SiteChrome.module.css";

function SocialIcon({ label }: { label: string }) {
  switch (label) {
    case "Facebook":
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 8.5V6.8c0-.9.6-1.1 1-1.1h1.9V2.5h-2.7C11.7 2.5 11 4.7 11 6.2v2.3H9v3.2h2V21h3.5v-9.3h2.6l.4-3.2h-3z" />
        </svg>
      );
    case "Pinterest":
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5a9.5 9.5 0 0 0-3.5 18.3c-.1-.8-.2-2 0-2.8l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1 .5 1.9 1.5 1.9 1.8 0 3.2-1.9 3.2-4.7 0-2.4-1.8-4.2-4.3-4.2-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.8.8 2.4.1.1.1.2.1.3l-.3 1.1c-.1.2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8.9.3 1.9.4 2.9.4a9.5 9.5 0 0 0 0-19z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5.3a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4zm0 11a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm8.5-11.2a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 2.5c2.6 0 2.9 0 3.9.1 1 0 1.5.2 1.9.4.5.2.8.4 1.2.8.4.4.6.7.8 1.2.2.4.3.9.4 1.9.1 1 .1 1.3.1 3.9s0 2.9-.1 3.9c0 1-.2 1.5-.4 1.9-.2.5-.4.8-.8 1.2-.4.4-.7.6-1.2.8-.4.2-.9.3-1.9.4-1 .1-1.3.1-3.9.1s-2.9 0-3.9-.1c-1 0-1.5-.2-1.9-.4a3.2 3.2 0 0 1-2-2c-.2-.4-.3-.9-.4-1.9-.1-1-.1-1.3-.1-3.9s0-2.9.1-3.9c0-1 .2-1.5.4-1.9.2-.5.4-.8.8-1.2.4-.4.7-.6 1.2-.8.4-.2.9-.3 1.9-.4 1-.1 1.3-.1 3.9-.1z" />
        </svg>
      );
    default:
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.5 6.4c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.3 1.7-2.2-.8.5-1.6.8-2.5 1a3.9 3.9 0 0 0-6.7 3.6A11.1 11.1 0 0 1 3.6 5.3a3.9 3.9 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.8-.5v.1a3.9 3.9 0 0 0 3.1 3.8c-.6.2-1.2.2-1.8.1a3.9 3.9 0 0 0 3.7 2.7A7.9 7.9 0 0 1 2.5 18.4 11.1 11.1 0 0 0 8.5 20c7.2 0 11.2-6 11.2-11.2v-.5c.8-.5 1.4-1.2 1.8-1.9z" />
        </svg>
      );
  }
}

function resolveCurrentSlug(pathname: string | null): Slug {
  if (!pathname) return "";
  if (pathname.includes("/portfolio")) return "portfolio";
  if (pathname.includes("/contact")) return "contact";
  if (pathname.includes("/privacy-policy")) return "privacy-policy";
  if (pathname.includes("/terms-and-conditions")) return "terms-and-conditions";
  return "";
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const slug = resolveCurrentSlug(pathname);
  const t = copy[locale];
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [logoW, logoH] = getImageDimensions("/images/logo.png");

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector("summary")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems: { label: string; target: string; active: boolean }[] = [
    {
      label: t.nav[0],
      target: slug === "" ? `${href(locale)}#block-about` : href(locale),
      active: slug === "",
    },
    {
      label: t.nav[1],
      target: href(locale, "portfolio"),
      active: slug === "portfolio",
    },
    {
      label: t.nav[2],
      target: href(locale, "contact"),
      active: slug === "contact",
    },
  ];

  const menuLabel = locale === "uk" ? "Меню навігації" : "Navigation menu";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.brandLink} href={href(locale)}>
          <img
            className={styles.brandLogo}
            src="/images/logo.png"
            width={logoW}
            height={logoH}
            alt="Lana Fox"
          />
        </a>

        <div className={styles.desktopBar}>
          <nav aria-label={ locale === "uk" ? "Основна навігація" : "Primary navigation" }>
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.target}
                    className={`${styles.navLink} ${item.active ? styles.navLinkActive : ""}`}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.utilityGroup}>
            <ul className={styles.socialList}>
              {site.social.map((s) => (
                <li key={s.label}>
                  <a
                    className={styles.socialLink}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                  >
                    <SocialIcon label={s.label} />
                  </a>
                </li>
              ))}
            </ul>

            <div
              className={styles.langSwitcher}
              role="group"
              aria-label={locale === "uk" ? "Мова сайту" : "Site language"}
            >
              <a
                href={href("uk", slug)}
                lang="uk"
                className={`${styles.langLink} ${locale === "uk" ? styles.langLinkActive : ""}`}
                aria-current={locale === "uk" ? "true" : undefined}
              >
                UK
              </a>
              <a
                href={href("en", slug)}
                lang="en"
                className={`${styles.langLink} ${locale === "en" ? styles.langLinkActive : ""}`}
                aria-current={locale === "en" ? "true" : undefined}
              >
                EN
              </a>
            </div>
          </div>
        </div>

        <details ref={detailsRef} className={styles.mobileMenu}>
          <summary className={styles.mobileSummary} aria-label={menuLabel}>
            <svg
              className={styles.menuBars}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </summary>

          <div className={styles.mobilePanel}>
            <nav aria-label={menuLabel}>
              <ul className={styles.mobileNavList}>
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.target}
                      className={`${styles.mobileNavLink} ${item.active ? styles.mobileNavLinkActive : ""}`}
                      aria-current={item.active ? "page" : undefined}
                      onClick={() => {
                        if (detailsRef.current) detailsRef.current.open = false;
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <ul className={styles.mobileSocialList}>
              {site.social.map((s) => (
                <li key={s.label}>
                  <a
                    className={styles.socialLink}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon label={s.label} />
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className={styles.mobileLangRow}>
              <a
                href={href("uk", slug)}
                lang="uk"
                className={`${styles.langLink} ${locale === "uk" ? styles.langLinkActive : ""}`}
                aria-current={locale === "uk" ? "true" : undefined}
              >
                Українська (UK)
              </a>
              <a
                href={href("en", slug)}
                lang="en"
                className={`${styles.langLink} ${locale === "en" ? styles.langLinkActive : ""}`}
                aria-current={locale === "en" ? "true" : undefined}
              >
                English (EN)
              </a>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const slug = resolveCurrentSlug(pathname);
  const t = copy[locale];
  const [logoW, logoH] = getImageDimensions("/images/logo1.png");
  const [ukW, ukH] = getImageDimensions("/images/language-icons/ukraine.png");
  const [enW, enH] = getImageDimensions(
    "/images/language-icons/united-kingdom.png",
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <a href={href(locale)} aria-label="Lana Fox">
            <img
              className={styles.footerLogo}
              src="/images/logo1.png"
              width={logoW}
              height={logoH}
              alt="Lana Fox"
              loading="lazy"
            />
          </a>
        </div>

        <div className={styles.contactItem}>
          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.5 7v10h15V7L12 12.2zm0-2L18.8 6H5.2L12 10.2z" />
          </svg>
          <a className={styles.contactLink} href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </div>

        <div className={styles.contactItem}>
          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
          </svg>
          <a className={styles.contactLink} href={`tel:${site.phone}`}>
            {site.phone}
          </a>
        </div>

        <div className={styles.flagRow}>
          <a
            href={href("uk", slug)}
            lang="uk"
            aria-label="Українська"
            className={`${styles.flagLink} ${locale === "uk" ? styles.flagLinkActive : ""}`}
          >
            <img
              className={styles.flagImg}
              src="/images/language-icons/ukraine.png"
              width={ukW}
              height={ukH}
              alt="Українська"
              loading="lazy"
            />
          </a>
          <a
            href={href("en", slug)}
            lang="en"
            aria-label="English"
            className={`${styles.flagLink} ${locale === "en" ? styles.flagLinkActive : ""}`}
          >
            <img
              className={styles.flagImg}
              src="/images/language-icons/united-kingdom.png"
              width={enW}
              height={enH}
              alt="English"
              loading="lazy"
            />
          </a>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerBottomInner}>
          <div>
            <a
              className={styles.footerLegalLink}
              href={href(locale, "privacy-policy")}
            >
              {t.privacy}
            </a>
          </div>
          <div>© 2020–2026 Lana Fox</div>
          <div>
            <a
              className={styles.footerLegalLink}
              href={href(locale, "terms-and-conditions")}
            >
              {t.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

