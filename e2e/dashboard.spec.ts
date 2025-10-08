import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should load dashboard data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for data to load
    await expect(page.locator('text=/tesorería|treasury/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/facturación|revenue/i')).toBeVisible();
    await expect(page.locator('text=/gastos|expenses/i')).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for numeric values (should have at least one number visible)
    await expect(page.locator('text=/€|EUR/').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show last activity indicator', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('text=/última actividad|last activity/i')).toBeVisible();
  });

  test('should navigate to other pages from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on Treasury
    await page.click('text=/tesorería|treasury/i');
    await expect(page).toHaveURL(/.*treasury/);
    
    // Click on Invoicing
    await page.click('text=/facturación|invoicing/i');
    await expect(page).toHaveURL(/.*invoicing/);
  });
});
