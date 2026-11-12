import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, "apps", "web", "out");

async function stampUkLang(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await stampUkLang(full);
    } else if (entry.name.endsWith(".html")) {
      const html = await fs.readFile(full, "utf8");
      const updated = html.replace(/<html lang="en"/g, '<html lang="uk"');
      if (updated !== html) {
        await fs.writeFile(full, updated, "utf8");
      }
    }
  }
}

await stampUkLang(path.join(outDir, "uk"));

const requiredFiles = [
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "staticwebapp.config.json",
  "en/index.html",
  "uk/index.html",
  "en/portfolio/index.html",
  "uk/portfolio/index.html",
  "en/contact/index.html",
  "uk/contact/index.html",
  "en/privacy-policy/index.html",
  "uk/privacy-policy/index.html",
  "en/terms-and-conditions/index.html",
  "uk/terms-and-conditions/index.html",
];

for (const rel of requiredFiles) {
  await fs.access(path.join(outDir, rel));
}

async function scanSecrets(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanSecrets(full);
    } else if (/\.(html|js|json|txt|xml|css)$/i.test(entry.name)) {
      const text = await fs.readFile(full, "utf8");
      if (
        text.includes("cloudinary://") ||
        text.includes("API_HASH_SECRET") ||
        text.includes("CONTACT_HASH_SECRET")
      ) {
        throw new Error(`Forbidden secret pattern detected in ${entry.name}`);
      }
    }
  }
}

await scanSecrets(outDir);
console.log("Static export verified in apps/web/out");
