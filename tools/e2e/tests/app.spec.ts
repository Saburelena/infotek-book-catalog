import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("catalog loads and main navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Книги" })).toBeVisible();

  await page.getByRole("link", { name: "Авторы" }).first().click();
  await expect(page.getByRole("heading", { name: "Авторы" })).toBeVisible();

  await page.getByRole("link", { name: "Книги" }).first().click();
  await expect(page.getByRole("heading", { name: "Книги" })).toBeVisible();
});

test("guest is redirected to login for protected page", async ({ page }) => {
  await page.goto("/books/new");
  await expect(page).toHaveURL(/\/login\?from=/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("demo user can sign in", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Логин").fill("user");
  await page.getByLabel("Пароль").fill("user123");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
  await expect(
  page.getByRole("banner").getByText("user", { exact: true }),
).toBeVisible();
});

test("catalog has no automatic axe violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
