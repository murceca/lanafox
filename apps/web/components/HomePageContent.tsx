import home from "../content/home.json";
import { href, type Locale } from "../content/site";
import {
  getImageDimensions,
  optimizedImageSrcSet,
  type LocalImagePath,
} from "../lib/local-images";
import { HeroCarousel } from "./HeroCarousel";
import styles from "./HomePageContent.module.css";

interface TextSegment {
  text: string;
  href?: string;
}

export function HomePageContent({ locale }: { locale: Locale }) {
  const t = home[locale];
  const [svetaW, svetaH] = getImageDimensions("/images/photo-of-sveta.jpg");
  const [marynaW, marynaH] = getImageDimensions(
    "/images/photos/testimonials/maryna.jpg",
  );

  const serviceItems: {
    label: string;
    src: LocalImagePath;
    baseName: string;
    widths: readonly number[];
  }[] = [
    {
      label: t.services_portrait,
      src: "/images/photos/services/portrait-photo.jpg",
      baseName: "service-portrait",
      widths: [360],
    },
    {
      label: t.services_landscape,
      src: "/images/photos/services/landscape-photo.jpg",
      baseName: "service-landscape",
      widths: [480],
    },
    {
      label: t.services_product,
      src: "/images/photos/services/product-photo.jpg",
      baseName: "service-product",
      widths: [480],
    },
    {
      label: t.services_event,
      src: "/images/photos/services/event-photo.jpg",
      baseName: "service-event",
      widths: [480],
    },
    {
      label: t.services_wedding,
      src: "/images/photos/services/wedding-photo.jpg",
      baseName: "service-wedding",
      widths: [480],
    },
    {
      label: t.services_lifestyle,
      src: "/images/photos/services/lifestyle-photo.jpg",
      baseName: "service-lifestyle",
      widths: [480],
    },
    {
      label: t.services_fashion,
      src: "/images/photos/services/fashion-photo.jpg",
      baseName: "service-fashion",
      widths: [480],
    },
    {
      label: t.services_editing,
      src: "/images/photos/services/editing-photo.jpg",
      baseName: "service-editing",
      widths: [480],
    },
  ];

  const descriptionParagraphs = t.description as TextSegment[][];
  const testimonialParagraphs = t.testimonials_1_description as TextSegment[][];

  return (
    <div className={styles.pageContainer}>
      <HeroCarousel locale={locale} />

      <div className={styles.contentSection}>
        <section id="block-about" className={styles.aboutCard}>
          <div className={styles.aboutGrid}>
            <div>
              <h1 className={styles.aboutHeading}>{t.about_block}</h1>
              <div className={styles.prose}>
                {descriptionParagraphs.map((paragraph, pIndex) => (
                  <p key={pIndex}>
                    {paragraph.map((seg, sIndex) => {
                      if (!seg.href) {
                        return <span key={sIndex}>{seg.text}</span>;
                      }
                      const cleanSlug = seg.href.replace(/^\/+|\/+$/g, "");
                      return (
                        <a
                          key={sIndex}
                          className={styles.inlineLink}
                          href={href(locale, cleanSlug)}
                        >
                          {seg.text}
                        </a>
                      );
                    })}
                  </p>
                ))}
              </div>
              <hr className={styles.divider} />
              <div className={styles.signature}>
                — {t.footer_text} <cite>{t.footer_name}</cite>
              </div>
            </div>

            <div className={styles.portraitFrame}>
              <picture>
                <source
                  type="image/avif"
                  srcSet={optimizedImageSrcSet(
                    "photo-of-sveta",
                    [320, 440],
                    "avif",
                  )}
                  sizes="(max-width: 991px) 320px, 440px"
                />
                <source
                  type="image/webp"
                  srcSet={optimizedImageSrcSet(
                    "photo-of-sveta",
                    [320, 440],
                    "webp",
                  )}
                  sizes="(max-width: 991px) 320px, 440px"
                />
                <img
                  className={styles.portraitImg}
                  src="/images/photo-of-sveta.jpg"
                  alt={t.about_block_photo_alt}
                  width={svetaW}
                  height={svetaH}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </section>

        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className={styles.sectionHeading}>
            {t.services}
          </h2>
          <ul className={styles.servicesGrid}>
            {serviceItems.map((service) => {
              const [w, h] = getImageDimensions(service.src);
              return (
                <li key={service.baseName} className={styles.serviceTile}>
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={optimizedImageSrcSet(
                        service.baseName,
                        service.widths,
                        "avif",
                      )}
                      sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 25vw"
                    />
                    <source
                      type="image/webp"
                      srcSet={optimizedImageSrcSet(
                        service.baseName,
                        service.widths,
                        "webp",
                      )}
                      sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 25vw"
                    />
                    <img
                      className={styles.serviceBg}
                      src={service.src}
                      alt=""
                      aria-hidden="true"
                      width={w}
                      height={h}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  <span className={styles.serviceScrim} aria-hidden="true" />
                  <span className={styles.serviceLabel}>{service.label}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="testimonials-heading">
          <h2 id="testimonials-heading" className={styles.sectionHeading}>
            {t.testimonials}
          </h2>
          <div className={styles.testimonialCard}>
            <h3 className={styles.testimonialTitle}>{t.testimonials_1_title}</h3>
            <div className={styles.testimonialGrid}>
              <div className={styles.portraitFrame}>
                <picture>
                  <source
                    type="image/avif"
                    srcSet={optimizedImageSrcSet(
                      "testimonial-maryna",
                      [440, 768],
                      "avif",
                    )}
                    sizes="(max-width: 991px) 100vw, 440px"
                  />
                  <source
                    type="image/webp"
                    srcSet={optimizedImageSrcSet(
                      "testimonial-maryna",
                      [440, 768],
                      "webp",
                    )}
                    sizes="(max-width: 991px) 100vw, 440px"
                  />
                  <img
                    className={styles.testimonialImg}
                    src="/images/photos/testimonials/maryna.jpg"
                    alt={t.testimonials_1_photo_alt}
                    width={marynaW}
                    height={marynaH}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>

              <div>
                <div className={styles.prose}>
                  {testimonialParagraphs.map((paragraph, pIndex) => (
                    <p key={pIndex}>
                      {paragraph.map((seg, sIndex) => (
                        <span key={sIndex}>{seg.text}</span>
                      ))}
                    </p>
                  ))}
                  <p>{t.testimonials_1_footer}</p>
                </div>
                <hr className={styles.divider} />
                <div className={styles.signature}>
                  —{" "}
                  {t.testimonials_1_footer_city
                    ? `${t.testimonials_1_footer_city} `
                    : ""}
                  <cite>{t.testimonials_1_footer_name}</cite>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

