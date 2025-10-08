import { test, expect } from '@playwright/test';

test.describe('Account Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to Mi Cuenta page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on Mi Cuenta link
    await page.click('text=/mi cuenta|account/i');
    await expect(page).toHaveURL(/.*account/);
  });

  test('should display user email', async ({ page }) => {
    await page.goto('/account');
    
    await expect(page.locator(`text=${process.env.TEST_USER_EMAIL}`)).toBeVisible();
  });

  test('should show change password form', async ({ page }) => {
    await page.goto('/account');
    
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Cambiar"), button:has-text("Change")')).toBeVisible();
  });
});
