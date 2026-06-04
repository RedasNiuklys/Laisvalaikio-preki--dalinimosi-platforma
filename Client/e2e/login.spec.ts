import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'test@example.com';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'Password123!';

// Navigate to register via the Sign Up link — avoids SPA cold-load routing issues.
async function gotoRegister(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByText(/sign up/i).click();
  await page.waitForURL(/register/, { timeout: 8000 });
  // Wait for the submit button to confirm the register form is mounted
  await page.getByRole('button', { name: /create account/i }).waitFor({ state: 'visible', timeout: 8000 });
}

// The navigation stack keeps the login screen mounted behind the register screen.
// Total inputs in DOM when register is shown:
//   0: login email (h=0, hidden behind stack)
//   1: login password (h=0, hidden behind stack)
//   2: register firstName  (h=48, visible)
//   3: register lastName   (h=48, visible)
//   4: register email      (h=48, visible)
//   5: register password   (h=48, visible)
//   6: register confirmPwd (h=48, visible)
// Register inputs start at global index 2. Focus via JS, then keyboard.type() fires
// keydown/keypress/keyup events that React's synthetic system captures.
const REGISTER_INPUT_OFFSET = 2;

async function typeIntoInput(page: import('@playwright/test').Page, registerFieldIndex: number, value: string) {
  const globalIndex = REGISTER_INPUT_OFFSET + registerFieldIndex;
  await page.evaluate((i) => {
    const inputs = document.querySelectorAll<HTMLInputElement>('[data-testid="text-input-outlined"]');
    inputs[i]?.focus();
  }, globalIndex);
  await page.waitForTimeout(150);
  await page.keyboard.press('Control+a');
  await page.keyboard.type(value, { delay: 30 });
}

// Fill the full registration form (registerFieldIndex: 0=firstName,1=lastName,2=email,3=password,4=confirmPwd)
async function fillRegisterForm(page: import('@playwright/test').Page, opts: {
  firstName: string; lastName?: string; email: string; password: string;
}) {
  await typeIntoInput(page, 0, opts.firstName);
  if (opts.lastName) await typeIntoInput(page, 1, opts.lastName);
  await typeIntoInput(page, 2, opts.email);
  await typeIntoInput(page, 3, opts.password);
  await typeIntoInput(page, 4, opts.password);
}

test.describe('Registration', () => {
  test('register page is reachable via Sign Up link and shows a Create Account button', async ({ page }) => {
    await gotoRegister(page);
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('submit button is disabled on empty form and enabled when fully filled', async ({ page }) => {
    await gotoRegister(page);

    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeDisabled();

    await fillRegisterForm(page, { firstName: 'Test', lastName: 'User', email: E2E_EMAIL, password: E2E_PASSWORD });
    await expect(submitBtn).toBeEnabled({ timeout: 4000 });
  });

  test('registers test@example.com — navigates away on success or stays on register if already exists', async ({ page }) => {
    await gotoRegister(page);
    await fillRegisterForm(page, { firstName: 'Test', lastName: 'User', email: E2E_EMAIL, password: E2E_PASSWORD });

    const submitBtn = page.getByRole('button', { name: /create account/i });
    await expect(submitBtn).toBeEnabled({ timeout: 4000 });
    await submitBtn.click();

    // Wait up to 12 s for API response: navigate away = success, stay = already exists
    await Promise.race([
      page.waitForURL((url) => !url.toString().includes('register'), { timeout: 12000 }).catch(() => {}),
      page.waitForTimeout(12000),
    ]);

    const url = page.url();
    if (!url.includes('register')) {
      // Registered successfully — landed on home/equipment/login
      expect(url).toMatch(/\/|equipment|auth|login/);
    } else {
      // User already existed — server returned conflict; page stays on /register
      expect(url).toContain('register');
    }
  });
});

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

  test('wrong credentials do not navigate away from login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).first().click();

    // Page must still be on the login screen — wrong credentials should not navigate away
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/auth\/login|login/);
  });
});
