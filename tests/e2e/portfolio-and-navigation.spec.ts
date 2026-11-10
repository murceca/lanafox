import { expect, test } from "@playwright/test";

const expectedPhotoCount = Number(process.env.EXPECTED_PHOTO_COUNT || 36);

test.describe("Portfolio gallery, lightbox, mobile menu, no-JS, and routing", () => {
  test("renders uncropped portfolio photos and supports accessible keyboard lightbox with focus restoration", async ({
    page,
  }) => {
    await page.goto("/en/portfolio/");

    const cards = page.getByTestId("portfolio-grid").locator("li");
    await expect(cards).toHaveCount(expectedPhotoCount);

    const firstLink = cards.nth(0).locator("a");
    const firstImg = firstLink.locator("img");
    await expect(firstImg).toHaveAttribute("width", /\d+/);
    await expect(firstImg).toHaveAttribute("height", /\d+/);

    await firstLink.focus();
    await firstLink.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`1 / ${expectedPhotoCount}`);

    // Navigate forward via ArrowRight
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText(`2 / ${expectedPhotoCount}`);

    // Close via Escape and confirm focus returns to opener thumbnail
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(firstLink).toBeFocused();
  });

  test("keeps mobile menu closed on load (zero CLS) and works without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3102/uk/");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");

    const details = page.locator("header details");
    await expect(details).not.toHaveAttribute("open", "");

    // Open native <details> summary with JS disabled
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");

    await details.locator("a[href='/uk/portfolio/']").click();
    await expect(page).toHaveURL(/\/uk\/portfolio\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Портфоліо" }),
    ).toBeVisible();

    await context.close();
  });

  test("redirects legacy root/query routes and serves custom 404 with status 404", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/$/);

    await page.goto("/portfolio?lang=uk");
    await expect(page).toHaveURL(/\/uk\/portfolio\/$/);

    await page.goto("/contact");
    await expect(page).toHaveURL(/\/en\/contact\/$/);

    const notFoundRes = await page.goto("/does-not-exist-at-all");
    expect(notFoundRes?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: /404/ }),
    ).toBeVisible();
    await expect(page.locator("main a[href='/en/']")).toBeVisible();
    await expect(page.locator("main a[href='/uk/']")).toBeVisible();
  });
});

