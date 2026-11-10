"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copy, type Locale } from "../content/site";
import styles from "./PortfolioGallery.module.css";

export interface GalleryItem {
  publicId: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  thumbSrc: string;
  srcSet?: string;
  fullSrc: string;
}

export function PortfolioGallery({
  items,
  locale,
}: {
  items: GalleryItem[];
  locale: Locale;
}) {
  const t = copy[locale];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const openerIndexRef = useRef<number | null>(null);

  const closeLightbox = useCallback(() => {
    const returnTo = openerIndexRef.current;
    setActiveIndex(null);
    openerIndexRef.current = null;
    if (returnTo !== null) {
      window.requestAnimationFrame(() => {
        triggerRefs.current[returnTo]?.focus();
      });
    }
  }, []);

  const showPrev = useCallback(() => {
    setActiveIndex((cur) =>
      cur === null ? null : (cur - 1 + items.length) % items.length,
    );
  }, [items.length]);

  const showNext = useCallback(() => {
    setActiveIndex((cur) => (cur === null ? null : (cur + 1) % items.length));
  }, [items.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showNext();
      } else if (e.key === "Tab") {
        const focusables = [
          closeBtnRef.current,
          prevBtnRef.current,
          nextBtnRef.current,
        ].filter((el): el is HTMLButtonElement => Boolean(el));
        if (!focusables.length) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, closeLightbox, showNext, showPrev]);

  if (!items.length) {
    return <p className={styles.emptyState}>{t.empty}</p>;
  }

  const activeItem = activeIndex !== null ? items[activeIndex] : undefined;

  return (
    <>
      <ul className={styles.grid} data-testid="portfolio-grid">
        {items.map((item, idx) => (
          <li key={item.publicId} className={styles.card}>
            <a
              ref={(el) => {
                triggerRefs.current[idx] = el;
              }}
              href={item.fullSrc}
              className={styles.thumbLink}
              onClick={(e) => {
                if (
                  e.button === 0 &&
                  !e.metaKey &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                  openerIndexRef.current = idx;
                  setActiveIndex(idx);
                }
              }}
            >
              <img
                className={styles.thumbImg}
                src={item.thumbSrc}
                srcSet={item.srcSet}
                sizes={
                  item.srcSet
                    ? "(max-width: 639px) 95vw, (max-width: 1023px) 48vw, 32vw"
                    : undefined
                }
                alt={item.alt}
                width={item.width}
                height={item.height}
                style={{ aspectRatio: `${item.width} / ${item.height}` }}
                loading={idx < 3 ? "eager" : "lazy"}
                decoding={idx < 3 ? "sync" : "async"}
              />
            </a>
          </li>
        ))}
      </ul>

      {activeItem && activeIndex !== null && (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.alt}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <div className={styles.dialogContent}>
            <div className={styles.topBar}>
              <span className={styles.counter}>
                {activeIndex + 1} / {items.length}
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                className={styles.lightboxBtn}
                onClick={closeLightbox}
              >
                {t.close}
              </button>
            </div>

            <div className={styles.stage}>
              <button
                ref={prevBtnRef}
                type="button"
                className={styles.lightboxBtn}
                aria-label={t.previous}
                onClick={showPrev}
              >
                ‹
              </button>

              <figure className={styles.stageFigure}>
                <img
                  className={styles.stageImg}
                  src={activeItem.fullSrc}
                  alt={activeItem.alt}
                  width={activeItem.width}
                  height={activeItem.height}
                />
                <figcaption className={styles.caption}>
                  {activeItem.caption || activeItem.alt}
                </figcaption>
              </figure>

              <button
                ref={nextBtnRef}
                type="button"
                className={styles.lightboxBtn}
                aria-label={t.next}
                onClick={showNext}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

