import { test, expect, Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'test@example.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'Password123!';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).first().click();
  await page.waitForURL(/equipment|tabs/, { timeout: 15000 });
}

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_EMAIL, E2E_PASSWORD);
  });

  test('equipment details page has a Book button', async ({ page }) => {
    await page.locator('[data-testid="equipment-card"]').first().click();
    await page.waitForURL(/equipment\/.+/, { timeout: 10000 });

    const bookButton = page.getByRole('button', { name: /book|create booking|booking\.create/i });
    await expect(bookButton).toBeVisible({ timeout: 8000 });
  });

  test('opening booking modal shows date pickers', async ({ page }) => {
    await page.locator('[data-testid="equipment-card"]').first().click();
    await page.waitForURL(/equipment\/.+/, { timeout: 10000 });

    await page.getByRole('button', { name: /book|create booking|booking\.create/i }).click();

    // Modal / dialog with date selection must appear
    await expect(
      page.locator('[role="dialog"], [data-testid="booking-modal"]').first()
    ).toBeVisible({ timeout: 6000 });
  });

  test('Bookings tab shows My Bookings heading', async ({ page }) => {
    // Navigate to the bookings tab
    await page.getByRole('link', { name: /bookings|my bookings/i }).click();
    await expect(
      page.getByText(/bookings\.title|my bookings/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
