import assert from "node:assert/strict";
import test from "node:test";
import {
  apiUrl,
  buildRobots,
  buildSitemap,
  discoverPhotos,
  loadPhotos,
  metadataFor,
  photoUrl,
  publicOrigin,
  validatePhotos,
  type Photo,
} from "../../apps/web/src";

test("discoverPhotos paginates cursors and detects cursor loops", async () => {
  const pages = new Map([
    [
      undefined,
      {
        resources: [{ public_id: "photos/002", width: 1200, height: 800 }],
        next_cursor: "cursor-1",
      },
    ],
    [
      "cursor-1",
      {
        resources: [{ public_id: "photos/001", width: 800, height: 1200 }],
      },
    ],
  ]);

  const found = await discoverPhotos(async (cursor) => pages.get(cursor)!);
  assert.equal(found.length, 2);
  assert.equal(found[0]?.public_id, "photos/002");
  assert.equal(found[1]?.public_id, "photos/001");

  await assert.rejects(
    () =>
      discoverPhotos(async () => ({
        resources: [],
        next_cursor: "stuck-cursor",
      })),
    /Repeated Cloudinary cursor/,
  );
});

test("validatePhotos filters unpublished items, sorts by order, and guards metadata", () => {
  const sample: Photo[] = [
    {
      publicId: "photos/b",
      width: 1000,
      height: 1500,
      alt: { en: "Portrait B", uk: "Портрет Б" },
      caption: { en: "", uk: "" },
      collection: "portfolio",
      order: 2,
      published: true,
    },
    {
      publicId: "photos/hidden",
      width: 1000,
      height: 1000,
      alt: { en: "Hidden", uk: "Приховано" },
      caption: { en: "", uk: "" },
      collection: "portfolio",
      order: 0,
      published: false,
    },
    {
      publicId: "photos/a",
      width: 1600,
      height: 1000,
      alt: { en: "Landscape A", uk: "Пейзаж А" },
      caption: { en: "", uk: "" },
      collection: "portfolio",
      order: 1,
      published: true,
    },
  ];

  const validated = validatePhotos(sample);
  assert.deepEqual(
    validated.map((p) => p.publicId),
    ["photos/a", "photos/b"],
  );

  assert.throws(
    () =>
      validatePhotos([
        { ...sample[0]!, src: "/images/../secret.jpg" },
      ]),
    /Invalid fixture image path/,
  );
});

test("photoUrl reads NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME strictly from env and caps width at 1920", () => {
  const prevCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  try {
    const cloudPhoto: Photo = {
      publicId: "photos/036_v0nptu",
      width: 3948,
      height: 2800,
      alt: { en: "Reichstag", uk: "Рейхстаг" },
      caption: { en: "", uk: "" },
      collection: "portfolio",
      order: 0,
      published: true,
    };

    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    assert.throws(() => photoUrl(cloudPhoto, 960), /NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/);

    assert.equal(
      photoUrl({ ...cloudPhoto, src: "/images/carousel-images/pic1.jpeg" }, 960),
      "/images/carousel-images/pic1.jpeg",
    );

    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo_cloud";
    assert.equal(
      photoUrl(cloudPhoto, 4000),
      "https://res.cloudinary.com/demo_cloud/image/upload/c_limit,w_1920,h_1920/f_auto/q_auto/photos/036_v0nptu",
    );
  } finally {
    if (prevCloud === undefined) {
      delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    } else {
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = prevCloud;
    }
  }
});

test("loadPhotos supports fixture (6), snapshot (36), and default snapshot modes cleanly", async () => {
  const prevSource = process.env.PHOTO_SOURCE;
  try {
    delete process.env.PHOTO_SOURCE;
    const defaultPhotos = await loadPhotos();
    assert.equal(defaultPhotos.length, 36);

    process.env.PHOTO_SOURCE = "fixture";
    const fixturePhotos = await loadPhotos();
    assert.equal(fixturePhotos.length, 6);

    process.env.PHOTO_SOURCE = "snapshot";
    const snapshotPhotos = await loadPhotos();
    assert.equal(snapshotPhotos.length, 36);
    assert.equal(snapshotPhotos[0]?.publicId, "photos/036_v0nptu");
    assert.equal(snapshotPhotos[35]?.publicId, "photos/001_i5e12f");
  } finally {
    if (prevSource === undefined) {
      delete process.env.PHOTO_SOURCE;
    } else {
      process.env.PHOTO_SOURCE = prevSource;
    }
  }
});

test("SEO helpers emit canonical URLs, hreflang alternates, sitemap, and robots", () => {
  const prevOrigin = process.env.SITE_ORIGIN;
  const prevDeploy = process.env.DEPLOY_ENV;
  try {
    delete process.env.SITE_ORIGIN;
    delete process.env.DEPLOY_ENV;

    assert.equal(publicOrigin(), "https://lanafox.eu");
    process.env.SITE_ORIGIN = "https://lanafox.eu";
    const ukPortfolio = metadataFor("uk", "portfolio");
    assert.equal(ukPortfolio.alternates.canonical, "https://lanafox.eu/uk/portfolio/");
    assert.equal(ukPortfolio.alternates.languages.en, "https://lanafox.eu/en/portfolio/");
    assert.equal(ukPortfolio.alternates.languages.uk, "https://lanafox.eu/uk/portfolio/");
    assert.equal(ukPortfolio.alternates.languages["x-default"], "https://lanafox.eu/en/portfolio/");
    assert.deepEqual(ukPortfolio.robots, { index: false, follow: false });

    process.env.DEPLOY_ENV = "production";
    assert.deepEqual(metadataFor("en", "").robots, { index: true, follow: true });

    const sitemap = buildSitemap();
    assert.equal(sitemap.length, 10);
    assert.equal(buildRobots().sitemap, "https://lanafox.eu/sitemap.xml");

    process.env.SITE_ORIGIN = "http://insecure.example.com";
    assert.throws(() => publicOrigin(), /HTTPS origin/);

    const prevApi = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      assert.equal(apiUrl("/api/contact"), "/api/contact");
      process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:7071/";
      assert.equal(
        apiUrl("/api/contact"),
        "http://localhost:7071/api/contact",
      );
    } finally {
      if (prevApi === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
      else process.env.NEXT_PUBLIC_API_BASE_URL = prevApi;
    }
  } finally {
    if (prevOrigin === undefined) delete process.env.SITE_ORIGIN;
    else process.env.SITE_ORIGIN = prevOrigin;
    if (prevDeploy === undefined) delete process.env.DEPLOY_ENV;
    else process.env.DEPLOY_ENV = prevDeploy;
  }
});

