import fs from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, "apps", "web", "out");
const port = Number(process.env.PORT || 3102);

const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

const legacySlugs = new Map([
  ["/", ""],
  ["/portfolio", "portfolio/"],
  ["/portfolio/", "portfolio/"],
  ["/contact", "contact/"],
  ["/contact/", "contact/"],
  ["/privacy-policy", "privacy-policy/"],
  ["/privacy-policy/", "privacy-policy/"],
  ["/terms-and-conditions", "terms-and-conditions/"],
  ["/terms-and-conditions/", "terms-and-conditions/"],
]);

const baseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.lanafox.eu http://localhost:7071; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);

    if (legacySlugs.has(pathname)) {
      const locale = url.searchParams.get("lang") === "uk" ? "uk" : "en";
      const slug = legacySlugs.get(pathname);
      res.writeHead(308, {
        ...baseHeaders,
        Location: `/${locale}/${slug}`,
      });
      res.end();
      return;
    }

    const resolved = path.resolve(outDir, `.${pathname}`);
    if (!resolved.startsWith(outDir)) {
      res.writeHead(400, baseHeaders);
      res.end();
      return;
    }

    let targetPath = resolved;
    const stat = await fs.stat(targetPath).catch(() => null);

    if (stat?.isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(308, {
          ...baseHeaders,
          Location: `${pathname}/${url.search}`,
        });
        res.end();
        return;
      }
      targetPath = path.join(targetPath, "index.html");
    }

    const data = await fs.readFile(targetPath).catch(() => null);
    if (!data) {
      const notFoundHtml = await fs
        .readFile(path.join(outDir, "404.html"))
        .catch(() => Buffer.from("Not Found"));
      res.writeHead(404, {
        ...baseHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(notFoundHtml);
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const cacheControl = pathname.startsWith("/_next/static/")
      ? "public, max-age=31536000, immutable"
      : pathname.startsWith("/optimized/") || pathname.startsWith("/images/")
        ? "public, max-age=604800, stale-while-revalidate=86400"
        : "no-cache";

    res.writeHead(200, {
      ...baseHeaders,
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": cacheControl,
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(500, baseHeaders);
    res.end();
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static export preview running at http://localhost:${port}`);
});

