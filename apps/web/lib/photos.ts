import delivery from "../content/cloudinary-public.json";
import fixtures from "../content/photos.fixture.json";
import curated from "../content/photos.production.json";

export interface Photo {
  publicId: string;
  width: number;
  height: number;
  alt: { en: string; uk: string };
  caption: { en: string; uk: string };
  collection: string;
  order: number;
  published: boolean;
  src?: string;
}

export interface CloudPage {
  resources: { public_id: string; width: number; height: number }[];
  next_cursor?: string;
}

export async function discoverPhotos(
  fetchPage: (cursor?: string) => Promise<CloudPage>,
) {
  const found: CloudPage["resources"] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    if (!Array.isArray(page.resources))
      throw new Error("Invalid Cloudinary response");
    found.push(...page.resources);
    cursor = page.next_cursor;
    if (cursor && seen.has(cursor))
      throw new Error("Repeated Cloudinary cursor");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return found;
}

export function validatePhotos(input: unknown): Photo[] {
  if (!Array.isArray(input)) throw new Error("Photo manifest must be an array");
  const ids = new Set<string>();
  return input
    .map((raw: unknown) => {
      if (!raw || typeof raw !== "object") throw new Error("Invalid photo");
      const p = raw as Photo;
      if (
        typeof p.publicId !== "string" ||
        !p.publicId.trim() ||
        ids.has(p.publicId) ||
        !Number.isInteger(p.width) ||
        p.width <= 0 ||
        !Number.isInteger(p.height) ||
        p.height <= 0 ||
        !Number.isFinite(p.order) ||
        typeof p.published !== "boolean" ||
        typeof p.collection !== "string" ||
        !p.collection
      )
        throw new Error("Invalid photo metadata");
      for (const locale of ["en", "uk"] as const)
        if (
          typeof p.alt?.[locale] !== "string" ||
          !p.alt[locale].trim() ||
          typeof p.caption?.[locale] !== "string"
        )
          throw new Error("Missing localized photo metadata");
      if (
        p.src !== undefined &&
        (typeof p.src !== "string" ||
          !p.src.startsWith("/images/") ||
          p.src.includes(".."))
      )
        throw new Error("Invalid fixture image path");
      ids.add(p.publicId);
      return p;
    })
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order || a.publicId.localeCompare(b.publicId));
}

export function photoUrl(photo: Photo, width = 960) {
  if (photo.src) return photo.src;
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || delivery.cloudName;
  if (!cloud || !/^[a-zA-Z0-9_-]+$/.test(cloud))
    throw new Error("Missing Cloudinary delivery configuration");
  return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_${Math.min(width, 1920)},h_1920/f_auto/q_auto/${photo.publicId.split("/").map(encodeURIComponent).join("/")}`;
}

export async function loadPhotos(): Promise<Photo[]> {
  if (process.env.PHOTO_SOURCE === "fixture") return validatePhotos(fixtures);
  if (process.env.PHOTO_SOURCE === "snapshot") {
    const photos = validatePhotos(curated);
    if (!photos.length) throw new Error("Recovered gallery is empty");
    return photos;
  }
  if (process.env.PHOTO_SOURCE !== "cloudinary")
    throw new Error(
      "Set PHOTO_SOURCE explicitly to fixture, snapshot or cloudinary",
    );
  if (!process.env.CLOUDINARY_URL)
    throw new Error("Missing Cloudinary build credentials");
  const { v2: cloudinary } = await import("cloudinary");
  const resources = await discoverPhotos(async (cursor) => {
    let query = cloudinary.search
      .expression("folder:photos")
      .sort_by("public_id", "desc")
      .max_results(90);
    if (cursor) query = query.next_cursor(cursor);
    return (await query.execute()) as CloudPage;
  });
  const manifest = validatePhotos(curated);
  if (!manifest.length) throw new Error("Production photo curation is empty");
  const byId = new Map(resources.map((r) => [r.public_id, r]));
  for (const p of manifest) {
    const r = byId.get(p.publicId);
    if (p.src || !r || r.width !== p.width || r.height !== p.height)
      throw new Error("Production photo metadata does not match Cloudinary");
  }
  return manifest;
}

