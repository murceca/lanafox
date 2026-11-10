import { expect, test } from "@playwright/test";

test.describe("Bilingual content parity and SEO metadata", () => {
  test("renders complete English home page, hero carousel, 8 services, testimonial, and contacts", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Lana Fox Photographer, Vinnytsia",
      }),
    ).toBeVisible();

    // Hero carousel (3 slides + reduced-motion starts paused)
    const carousel = page.getByRole("region", { name: "Featured photographs" });
    await expect(carousel).toBeVisible();
    await expect(carousel.locator("picture source[type='image/avif']")).toHaveCount(
      3,
    );
    await expect(
      carousel.getByRole("button", { name: "Play slideshow" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Full biography text + localized contact link
    await expect(page.locator("#block-about")).toContainText("Nikon DSLR camera");
    await expect(
      page.locator("#block-about a[href='/en/contact/']"),
    ).toBeVisible();

    // All 8 service categories
    const expectedServices = [
      "PORTRAIT PHOTOGRAPHY",
      "LANDSCAPE PHOTOGRAPHY",
      "PRODUCT PHOTOGRAPHY",
      "EVENT PHOTOGRAPHY",
      "WEDDING PHOTOGRAPHY",
      "LIFESTYLE PHOTOGRAPHY",
      "FASHION PHOTOGRAPHY",
      "PHOTO RETOUCHING",
    ];
    for (const service of expectedServices) {
      await expect(page.getByText(service, { exact: true })).toBeVisible();
    }

    // Full client testimonial
    await expect(
      page.getByRole("heading", {
        name: "Thank you Svitlana for a fantastic photoshoot!",
      }),
    ).toBeVisible();
    await expect(page.locator("main")).toContainText(
      "On the photos, I'm always real and that's what I really appreciate.",
    );
    await expect(page.locator("main")).toContainText("Maryna");

    // Footer & social links
    await expect(
      page.locator("footer a[href='mailto:contact@lanafox.eu']"),
    ).toBeVisible();
    await expect(
      page.locator("footer a[href='tel:+380987034015']"),
    ).toBeVisible();

    for (const domain of [
      "facebook.com/lanafox.ph",
      "pinterest.com/lanafox_ph",
      "instagram.com/lanafox.ph",
      "twitter.com/lanafox_ph",
    ]) {
      await expect(page.locator(`header a[href*='${domain}']`).first()).toHaveCount(
        1,
      );
    }

    // Zero legacy Google Universal Analytics scripts
    await expect(
      page.locator("script[src*='googletagmanager']"),
    ).toHaveCount(0);
  });

  test("renders complete Ukrainian home page and switches locales while preserving slug", async ({
    page,
  }) => {
    await page.goto("/uk/");

    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Lana Fox Фотограф, Вінниця",
      }),
    ).toBeVisible();
    await expect(page.locator("#block-about")).toContainText(
      "дзеркальну камеру Nikon",
    );
    await expect(
      page.locator("#block-about a[href='/uk/contact/']"),
    ).toBeVisible();
    await expect(
      page.locator("#block-about a[href='/uk/portfolio/']"),
    ).toBeVisible();

    await expect(
      page.getByText("ПОРТРЕТНА ФОТОЗЙОМКА", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("ОБРОБКА ФОТОГРАФІЙ", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Це була чудова фотосесія!" }),
    ).toBeVisible();

    // Navigate to UK Privacy Policy and switch language to EN
    await page.goto("/uk/privacy-policy/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Політика конфіденційності" }),
    ).toBeVisible();
    await expect(page.locator("article section")).toHaveCount(7);

    await page.locator("header a[href='/en/privacy-policy/']").first().click();
    await expect(page).toHaveURL(/\/en\/privacy-policy\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy policy" }),
    ).toBeVisible();
    await expect(page.locator("article section")).toHaveCount(7);
  });

  test("renders substantive Terms & Conditions and emits valid canonical, hreflang, sitemap, and robots", async ({
    page,
    request,
  }) => {
    await page.goto("/en/terms-and-conditions/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Terms and conditions" }),
    ).toBeVisible();
    await expect(page.locator("article section")).toHaveCount(7);

    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      "https://lanafox.eu/en/terms-and-conditions/",
    );
    await expect(
      page.locator("link[rel='alternate'][hreflang='uk']"),
    ).toHaveAttribute("href", "https://lanafox.eu/uk/terms-and-conditions/");
    await expect(
      page.locator("link[rel='alternate'][hreflang='x-default']"),
    ).toHaveAttribute("href", "https://lanafox.eu/en/terms-and-conditions/");

    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("https://lanafox.eu/en/portfolio/");
    expect(sitemapXml).toContain("https://lanafox.eu/uk/portfolio/");

    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    expect(await robotsRes.text()).toContain(
      "Sitemap: https://lanafox.eu/sitemap.xml",
    );
  });
});

