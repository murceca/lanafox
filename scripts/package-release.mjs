import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webOutDir = path.join(rootDir, "apps", "web", "out");
const artifactsDir = path.join(rootDir, "artifacts");
const webArtifactDir = path.join(artifactsDir, "web");
const apiArtifactDir = path.join(artifactsDir, "api");

const FORBIDDEN_PATTERNS = [
  "cloudinary://",
  "API_HASH_SECRET=",
  "CONTACT_HASH_SECRET=",
];

async function ensureWebOut() {
  try {
    await fs.access(path.join(webOutDir, "staticwebapp.config.json"));
    await fs.access(path.join(webOutDir, "en", "index.html"));
    await fs.access(path.join(webOutDir, "uk", "index.html"));
  } catch {
    throw new Error(
      "Missing static export in apps/web/out. Run `npm run build:preview`, `npm run build:fixture`, or `npm run build` before `npm run package:release`.",
    );
  }
}

async function scanAndHashDirectory(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await scanAndHashDirectory(fullPath, baseDir)));
    } else if (entry.isFile()) {
      const buf = await fs.readFile(fullPath);
      if (/\.(html|js|json|txt|xml|css)$/i.test(entry.name)) {
        const text = buf.toString("utf8");
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (text.includes(pattern)) {
            throw new Error(
              `Forbidden secret pattern "${pattern}" detected in ${relPath}`,
            );
          }
        }
      }
      const sha256 = createHash("sha256").update(buf).digest("hex");
      files.push({ path: relPath, bytes: buf.byteLength, sha256 });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

await ensureWebOut();

// Compile shared contracts and API workspace
execFileSync("npm", ["run", "build", "-w", "@lanafox/contracts"], {
  cwd: rootDir,
  stdio: "inherit",
});
execFileSync("npm", ["run", "build", "-w", "@lanafox/api"], {
  cwd: rootDir,
  stdio: "inherit",
});

await fs.rm(artifactsDir, { recursive: true, force: true });
await fs.mkdir(webArtifactDir, { recursive: true });
await fs.mkdir(apiArtifactDir, { recursive: true });

// 1. Copy static web export
await fs.cp(webOutDir, webArtifactDir, { recursive: true });

// 2. Assemble standalone Azure Function v4 artifact
await fs.copyFile(
  path.join(rootDir, "apps", "api", "host.json"),
  path.join(apiArtifactDir, "host.json"),
);
await fs.copyFile(
  path.join(rootDir, "deployment", "api", "package.json"),
  path.join(apiArtifactDir, "package.json"),
);
await fs.copyFile(
  path.join(rootDir, "deployment", "api", "package-lock.json"),
  path.join(apiArtifactDir, "package-lock.json"),
);
await fs.cp(
  path.join(rootDir, "apps", "api", "dist"),
  path.join(apiArtifactDir, "dist"),
  { recursive: true },
);

execFileSync("npm", ["ci", "--omit=dev", "--ignore-scripts"], {
  cwd: apiArtifactDir,
  stdio: "inherit",
});

// Copy compiled @lanafox/contracts into artifacts/api/node_modules/@lanafox/contracts
const contractsTargetDir = path.join(
  apiArtifactDir,
  "node_modules",
  "@lanafox",
  "contracts",
);
await fs.mkdir(contractsTargetDir, { recursive: true });
await fs.copyFile(
  path.join(rootDir, "packages", "contracts", "package.json"),
  path.join(contractsTargetDir, "package.json"),
);
await fs.cp(
  path.join(rootDir, "packages", "contracts", "dist"),
  path.join(contractsTargetDir, "dist"),
  { recursive: true },
);

// 3. Verify and compute SHA-256 manifest
const webFiles = await scanAndHashDirectory(webArtifactDir);
const apiFiles = await scanAndHashDirectory(apiArtifactDir);

let gitCommit = "unknown";
try {
  gitCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
} catch {
  // Non-git environment fallback
}

const manifestSummary = {
  generatedAt: new Date().toISOString(),
  gitCommit,
  nodeVersion: process.version,
  web: {
    fileCount: webFiles.length,
    totalBytes: webFiles.reduce((sum, f) => sum + f.bytes, 0),
    sha256: createHash("sha256")
      .update(JSON.stringify(webFiles))
      .digest("hex"),
  },
  api: {
    fileCount: apiFiles.length,
    totalBytes: apiFiles.reduce((sum, f) => sum + f.bytes, 0),
    sha256: createHash("sha256")
      .update(JSON.stringify(apiFiles))
      .digest("hex"),
  },
};

await fs.writeFile(
  path.join(artifactsDir, "release.json"),
  `${JSON.stringify(manifestSummary, null, 2)}\n`,
  "utf8",
);

console.log(
  `Release artifacts packaged in artifacts/ (web: ${webFiles.length} files, api: ${apiFiles.length} source files)`,
);

