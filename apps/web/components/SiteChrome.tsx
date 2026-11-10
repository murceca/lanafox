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
    case "Instagram":
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case "Threads":
    default:
      return (
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221Z" />
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
  const t = copy[locale];
  const [logoW, logoH] = getImageDimensions("/images/logo1.png");

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <a
          className={styles.footerBrandLink}
          href={href(locale)}
          aria-label="Lana Fox"
        >
          <img
            className={styles.footerLogo}
            src="/images/logo1.png"
            width={logoW}
            height={logoH}
            alt="Lana Fox"
            loading="lazy"
          />
        </a>

        <div className={styles.contactItem}>
          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.5 7v10h15V7L12 12.2zm0-2L18.8 6H5.2L12 10.2z" />
          </svg>
          <a className={styles.contactLink} href={`mailto:${site.email}`}>
            {site.email}
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

