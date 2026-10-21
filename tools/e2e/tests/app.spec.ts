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
  await expect(page.getByRole("banner").getByText("user", { exact: true })).toBeVisible();
});

test("catalog has no automatic axe violations", async ({ page }) => {
  await page.goto("/");

  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
test("user can log out and sees guest controls", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Логин").fill("user");
  await page.getByLabel("Пароль").fill("user123");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("theme toggle changes html data-theme attribute", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");

  await page.locator("button.theme-toggle").click();

  await expect.poll(async () => html.getAttribute("data-theme")).not.toBe(before);
});

test("catalog pagination navigates to page 2", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Книги" })).toBeVisible();

  const pager = page.locator("nav[aria-label='Страницы']");
  await expect(pager).toBeVisible();
  await pager.getByRole("button", { name: /Следующая страница/ }).click();

  await expect(page.locator("span[aria-live='polite']")).toContainText("Страница 2 из");
});

test("author filter narrows catalog results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Книги" })).toBeVisible();

  await page.getByRole("button", { name: "Автор" }).click();
  await page.getByRole("option", { name: "Лев Николаевич Толстой" }).click();
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.locator(".book-grid .book-card").first()).toBeVisible();
});

test("empty search shows empty state", async ({ page }) => {
  await page.goto("/");
  await page.locator("input[name='search']").fill("zzz-нет-такого");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText("Ничего не найдено")).toBeVisible();
});

test("report page renders rank list", async ({ page }) => {
  await page.goto("/report");
  await expect(page.getByRole("heading", { name: "ТОП-10 авторов" })).toBeVisible();
  await expect(page.locator("ol.rank-list li").first()).toBeVisible();
});

test("report page has no automatic axe violations", async ({ page }) => {
  await page.goto("/report");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
