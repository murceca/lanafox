import type { Metadata } from "next";
import {
  PortfolioGallery,
  type GalleryItem,
} from "../../../components/PortfolioGallery";
import styles from "../../../components/PortfolioGallery.module.css";
import { copy } from "../../../content/site";
import { loadPhotos, photoUrl } from "../../../lib/photos";
import { assertLocale } from "../../../lib/route-locale";
import { metadataFor } from "../../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return metadataFor(assertLocale(locale), "portfolio");
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = assertLocale(rawLocale);
  const photos = await loadPhotos();

  const items: GalleryItem[] = photos.map((photo) => {
    const isLocalFixture = Boolean(photo.src);
    const responsiveWidths = [480, 768, 1080].filter((w) => w <= photo.width);
    const srcSet =
      !isLocalFixture && responsiveWidths.length
        ? responsiveWidths
            .map((w) => `${photoUrl(photo, w)} ${w}w`)
            .join(", ")
        : undefined;

    return {
      publicId: photo.publicId,
      width: photo.width,
      height: photo.height,
      alt: photo.alt[locale],
      caption: photo.caption[locale],
      thumbSrc: photoUrl(photo, 768),
      srcSet,
      fullSrc: photoUrl(photo, 1920),
    };
  });

  return (
    <section className={styles.section}>
      <h1 className={styles.heading}>{copy[locale].portfolio}</h1>
      <PortfolioGallery items={items} locale={locale} />
    </section>
  );
}
