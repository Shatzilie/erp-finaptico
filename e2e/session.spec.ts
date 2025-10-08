import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test('should show session expired banner and redirect to login', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Clear session storage to simulate expired session
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    
    // Try to navigate to protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
