"use client";

import { useEffect, useState } from "react";
import home from "../content/home.json";
import { copy, type Locale } from "../content/site";
import {
  getImageDimensions,
  optimizedImageSrcSet,
  type LocalImagePath,
} from "../lib/local-images";
import styles from "./HeroCarousel.module.css";

interface SlideItem {
  src: LocalImagePath;
  baseName: string;
  alt: string;
}

export function HeroCarousel({ locale }: { locale: Locale }) {
  const t = home[locale];
  const labels = copy[locale];
  const slides: SlideItem[] = [
    {
      src: "/images/carousel-images/pic2.jpeg",
      baseName: "carousel-pic2",
      alt: t.carousel_alt_1,
    },
    {
      src: "/images/carousel-images/pic3.jpeg",
      baseName: "carousel-pic3",
      alt: t.carousel_alt_2,
    },
    {
      src: "/images/carousel-images/pic1.jpeg",
      baseName: "carousel-pic1",
      alt: t.carousel_alt_3,
    },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPaused(true);
    }
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) setPaused(true);
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const goPrev = () =>
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((prev) => (prev + 1) % slides.length);

  const carouselLabel =
    locale === "uk" ? "Обрані фотографії" : "Featured photographs";
  const pauseLabel = paused
    ? locale === "uk"
      ? "Відтворити слайд-шоу"
      : "Play slideshow"
    : locale === "uk"
      ? "Призупинити слайд-шоу"
      : "Pause slideshow";

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label={carouselLabel}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPaused(true);
          goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setPaused(true);
          goNext();
        }
      }}
    >
      <div className={styles.viewport}>
        {slides.map((slide, i) => {
          const [w, h] = getImageDimensions(slide.src);
          const active = i === index;
          return (
            <figure
              key={slide.src}
              className={`${styles.slide} ${active ? styles.slideActive : ""}`}
              aria-hidden={!active}
            >
              <picture>
                <source
                  type="image/avif"
                  srcSet={optimizedImageSrcSet(
                    slide.baseName,
                    [640, 1080, 1600],
                    "avif",
                  )}
                  sizes="100vw"
                />
                <source
                  type="image/webp"
                  srcSet={optimizedImageSrcSet(
                    slide.baseName,
                    [640, 1080, 1600],
                    "webp",
                  )}
                  sizes="100vw"
                />
                <img
                  className={styles.image}
                  src={slide.src}
                  alt={slide.alt}
                  width={w}
                  height={h}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding={i === 0 ? "sync" : "async"}
                />
              </picture>
            </figure>
          );
        })}
      </div>

      <div className={styles.controlsBar}>
        <button
          type="button"
          className={styles.controlBtn}
          aria-label={labels.previous}
          onClick={() => {
            setPaused(true);
            goPrev();
          }}
        >
          ‹
        </button>

        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              key={slide.baseName}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              aria-label={
                locale === "uk" ? `Слайд ${i + 1}` : `Slide ${i + 1}`
              }
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                setPaused(true);
                setIndex(i);
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.controlBtn}
          aria-label={labels.next}
          onClick={() => {
            setPaused(true);
            goNext();
          }}
        >
          ›
        </button>

        <button
          type="button"
          className={styles.controlBtn}
          aria-label={pauseLabel}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "▶" : "❚❚"}
        </button>
      </div>
    </section>
  );
}

