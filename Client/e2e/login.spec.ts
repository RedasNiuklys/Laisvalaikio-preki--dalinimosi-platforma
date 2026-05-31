import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('unauthenticated root redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/auth\/login|login/);
  });

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('wrong credentials shows an error message', async ({ page }) => {
    await page.goto('/auth/login');

    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // An error toast or inline error must appear
    await expect(
      page.locator('[role="alert"], [data-testid="toast"], [aria-live="polite"]').first()
    ).toBeVisible({ timeout: 8000 });
  });
});
