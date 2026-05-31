import { test, expect, Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'test@example.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'Password123!';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/equipment|tabs/, { timeout: 15000 });
}

test.describe('Equipment list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD);
  });

  test('shows equipment cards after login', async ({ page }) => {
    // At least one card or list item rendered
    await expect(page.locator('[data-testid="equipment-card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('search input filters visible results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="ieškoti" i]').first();
    await searchInput.fill('Bicycle');
    await page.waitForTimeout(500);
    // Only results containing "Bicycle" (case-insensitive) should remain
    const cards = page.locator('[data-testid="equipment-card"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/bicycle/i);
    }
  });

  test('clicking a card navigates to equipment details', async ({ page }) => {
    await page.locator('[data-testid="equipment-card"]').first().click();
    await page.waitForURL(/equipment\/\d+|equipment\/.+/, { timeout: 10000 });
    await expect(page.locator('h1, [data-testid="equipment-name"]').first()).toBeVisible();
  });
});
