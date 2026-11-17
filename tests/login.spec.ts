import { expect, test } from "@playwright/test";

test("shows an error when login credentials are rejected", async ({ page }) => {
  let loginRequestBody: unknown;

  await page.route("**/api/auth/login", async (route) => {
    loginRequestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: "The email or password is incorrect.",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("demo2@gmail.com");
  await page.getByLabel("Password").fill("1234567");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "The email or password is incorrect.",
  );
  await expect(page).toHaveURL(/\/login$/);
  expect(loginRequestBody).toEqual({
    email: "demo@gmail.com",
    password: "1234567",
  });
});
