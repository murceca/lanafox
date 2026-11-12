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
        name: "Lana Fox Photographer",
      }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Vinnytsia");
    await expect(page.locator("main")).not.toContainText("personal");

    // Hero carousel (3 slides + reduced-motion starts paused)
    const carousel = page.getByRole("region", { name: "Featured photographs" });
    await expect(carousel).toBeVisible();
    await expect(carousel.locator("picture source[type='image/avif']")).toHaveCount(
      3,
    );
    await expect(
      carousel.getByRole("button", { name: "Play slideshow" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Full biography text + localized contact and portfolio links
    await expect(page.locator("#block-about")).toContainText("Nikon DSLR camera");
    await expect(page.locator("#block-about")).toContainText("Your photographer,");
    await expect(
      page.locator("#block-about a[href='/en/contact/']"),
    ).toBeVisible();
    await expect(
      page.locator("#block-about a[href='/en/portfolio/']"),
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

    // Full client review
    await expect(
      page.getByRole("heading", { level: 2, name: "REVIEWS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Thank you, Svitlana, for a fantastic photoshoot!",
      }),
    ).toBeVisible();
    await expect(page.locator("main")).toContainText(
      "In the photos, I'm always real, and that's what I truly appreciate.",
    );
    await expect(page.locator("main")).toContainText("Maryna");

    // Footer & social links
    const footerLogo = page.locator("footer a[aria-label='Lana Fox']");
    const footerEmail = page.locator("footer a[href='mailto:contact@lanafox.eu']");
    await expect(footerLogo).toBeVisible();
    await expect(footerEmail).toBeVisible();
    await expect(page.locator("footer a[href^='tel:']")).toHaveCount(0);
    await expect(page.locator("footer a[lang]")).toHaveCount(0);

    const logoBox = await footerLogo.boundingBox();
    const emailBox = await footerEmail.boundingBox();
    expect(logoBox).not.toBeNull();
    expect(emailBox).not.toBeNull();
    expect(logoBox!.x).toBeLessThan(200);
    expect(emailBox!.x).toBeGreaterThan(800);

    for (const domain of [
      "facebook.com/lanafox.ph",
      "instagram.com/lanafox.ph",
      "threads.net/@lanafox.ph",
    ]) {
      await expect(page.locator(`header a[href*='${domain}']`).first()).toHaveCount(
        1,
      );
    }
    await expect(page.locator("header a[href*='pinterest.com']")).toHaveCount(0);
    await expect(page.locator("header a[href*='twitter.com']")).toHaveCount(0);

    // Zero legacy Google Universal Analytics scripts
    await expect(
      page.locator("script[src*='googletagmanager']"),
    ).toHaveCount(0);

    // Preload link for hero LCP AVIF image is emitted in <head>
    await expect(
      page.locator("head link[rel='preload'][as='image'][type='image/avif']"),
    ).toHaveAttribute("imagesrcset", /carousel-pic2-640\.avif/);
  });

  test("renders complete Ukrainian home page and switches locales while preserving slug", async ({
    page,
  }) => {
    await page.goto("/uk/");

    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Lana Fox Фотограф",
      }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Вінниц");
    await expect(page.locator("main")).not.toContainText("персональний");
    await expect(page.locator("#block-about")).toContainText(
      "дзеркальну камеру Nikon",
    );
    await expect(page.locator("#block-about")).toContainText("Ваш фотограф,");
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
    await expect(page.locator("article [role='note']")).toHaveCount(0);

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

  test("meets mobile LCP (<= 2.5s) and CLS (<= 0.1) budgets on home page", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      const win = window as unknown as {
        __lcp: number;
        __cls: number;
      };
      win.__lcp = 0;
      win.__cls = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) win.__lcp = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        })[]) {
          if (!entry.hadRecentInput && typeof entry.value === "number") {
            win.__cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto("/en/", { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => {
      const win = window as unknown as { __lcp: number; __cls: number };
      return { lcp: win.__lcp, cls: win.__cls };
    });

    expect(metrics.lcp).toBeLessThanOrEqual(2500);
    expect(metrics.cls).toBeLessThanOrEqual(0.1);
    await context.close();
  });
});

