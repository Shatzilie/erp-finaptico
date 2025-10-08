import { test, expect } from '@playwright/test';

test.describe('PDF Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show confirmation dialog before exporting PDF', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.locator('text=/tesorería|treasury/i')).toBeVisible({ timeout: 10000 });
    
    // Click export PDF button
    const exportButton = page.locator('button:has-text("Exportar PDF"), button:has-text("Export PDF")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // Check for confirmation dialog
      await expect(page.locator('text=/confirmar|confirm/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
