export {
  copy,
  href,
  locales,
  site,
  slugs,
  type Locale,
  type Slug,
} from "../content/site";
export {
  discoverPhotos,
  loadPhotos,
  photoUrl,
  validatePhotos,
  type CloudPage,
  type Photo,
} from "../lib/photos";
export {
  getImageDimensions,
  optimizedImageSrcSet,
  type LocalImagePath,
} from "../lib/local-images";
export {
  buildRobots,
  buildSitemap,
  metadataFor,
  publicOrigin,
  type PageMetadata,
} from "../lib/seo";

