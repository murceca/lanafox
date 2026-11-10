import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 24) {
  console.error(
    `\n[lanafox] Active Node.js is ${process.version}, but Node.js 24 LTS (.nvmrc) is required.\nRun in your terminal:\n  nvm use\n  nvm alias default 24.22.2\n`,
  );
  process.exit(1);
}

const { default: sharp } = await import("sharp");

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "apps", "web", "public");
const outDir = path.join(publicDir, "optimized");

const targets = [
  {
    src: "images/carousel-images/pic1.jpeg",
    baseName: "carousel-pic1",
    widths: [640, 1080, 1600],
  },
  {
    src: "images/carousel-images/pic2.jpeg",
    baseName: "carousel-pic2",
    widths: [640, 1080, 1600],
  },
  {
    src: "images/carousel-images/pic3.jpeg",
    baseName: "carousel-pic3",
    widths: [640, 1080, 1600],
  },
  {
    src: "images/photo-of-sveta.jpg",
    baseName: "photo-of-sveta",
    widths: [320, 440],
  },
  {
    src: "images/photos/testimonials/maryna.jpg",
    baseName: "testimonial-maryna",
    widths: [440, 768],
  },
  {
    src: "images/bg-contact.jpg",
    baseName: "bg-contact",
    widths: [768, 1440],
  },
  {
    src: "images/photos/services/portrait-photo.jpg",
    baseName: "service-portrait",
    widths: [360],
  },
  {
    src: "images/photos/services/landscape-photo.jpg",
    baseName: "service-landscape",
    widths: [480],
  },
  {
    src: "images/photos/services/product-photo.jpg",
    baseName: "service-product",
    widths: [480],
  },
  {
    src: "images/photos/services/event-photo.jpg",
    baseName: "service-event",
    widths: [480],
  },
  {
    src: "images/photos/services/wedding-photo.jpg",
    baseName: "service-wedding",
    widths: [480],
  },
  {
    src: "images/photos/services/lifestyle-photo.jpg",
    baseName: "service-lifestyle",
    widths: [480],
  },
  {
    src: "images/photos/services/fashion-photo.jpg",
    baseName: "service-fashion",
    widths: [480],
  },
  {
    src: "images/photos/services/editing-photo.jpg",
    baseName: "service-editing",
    widths: [480],
  },
];

await fs.mkdir(outDir, { recursive: true });

for (const item of targets) {
  const inputPath = path.join(publicDir, item.src);
  const srcStat = await fs.stat(inputPath);
  for (const width of item.widths) {
    const avifPath = path.join(outDir, `${item.baseName}-${width}.avif`);
    const webpPath = path.join(outDir, `${item.baseName}-${width}.webp`);

    const avifFresh = await fs
      .stat(avifPath)
      .then((s) => s.mtimeMs >= srcStat.mtimeMs)
      .catch(() => false);
    if (!avifFresh) {
      await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .avif({ quality: 62, effort: 4 })
        .toFile(avifPath);
    }

    const webpFresh = await fs
      .stat(webpPath)
      .then((s) => s.mtimeMs >= srcStat.mtimeMs)
      .catch(() => false);
    if (!webpFresh) {
      await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(webpPath);
    }
  }
}

console.log(`Optimized local derivatives ready in ${path.relative(rootDir, outDir)}`);

