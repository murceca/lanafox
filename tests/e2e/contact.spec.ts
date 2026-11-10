import { expect, test } from "@playwright/test";

test.describe("Contact form and local loopback test inbox", () => {
  test("displays honest local preview notice and records message in mock inbox without sending email", async ({
    page,
    request,
  }) => {
    await page.goto("/en/contact/");

    // L4: Honest local inbox notice must be visible
    await expect(page.getByTestId("local-inbox-notice")).toContainText(
      "no real email is sent",
    );

    const uniqueEmail = `e2e-${Date.now()}@example.com`;
    await page.getByLabel("Your name").fill("Iryna Test");
    await page.getByLabel("Your email").fill(uniqueEmail);
    await page
      .getByLabel("Message")
      .fill("Hello! Testing the local preview contact form via Playwright.");

    await page.getByRole("button", { name: "Send message" }).click();

    const statusBox = page.getByRole("status");
    await expect(statusBox).toContainText("Thank you for your message!");
    await expect(statusBox).toContainText("no email was sent");

    const inboxRes = await request.get("http://localhost:7071/__test/inbox");
    expect(inboxRes.status()).toBe(200);
    const messages = (await inboxRes.json()) as {
      name: string;
      email: string;
      message: string;
    }[];
    const match = messages.find((m) => m.email === uniqueEmail);
    expect(match).toBeDefined();
    expect(match?.name).toBe("Iryna Test");
  });
});

