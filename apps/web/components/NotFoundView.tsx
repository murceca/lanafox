import { getImageDimensions } from "../lib/local-images";
import styles from "./NotFoundView.module.css";

export function NotFoundView() {
  const [w, h] = getImageDimensions("/images/not-found/720w.jpg");

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <picture>
          <source
            media="(min-width: 1200px)"
            srcSet="/images/not-found/1920w.jpg"
          />
          <source
            media="(min-width: 720px)"
            srcSet="/images/not-found/1200w.jpg"
          />
          <img
            className={styles.image}
            src="/images/not-found/720w.jpg"
            alt="Page not found / Сторінку не знайдено"
            width={w}
            height={h}
          />
        </picture>
      </div>

      <div className={styles.overlay}>
        <h1 className={styles.heading}>
          404 — Sorry, we couldn’t find that page
        </h1>
        <p className={styles.subtext} lang="uk">
          На жаль, сторінку не знайдено.
        </p>
        <div className={styles.actions}>
          <a className={styles.linkBtn} href="/en/">
            English Home
          </a>
          <a className={styles.linkBtn} href="/uk/" lang="uk">
            Головна українською
          </a>
        </div>
      </div>
    </div>
  );
}

