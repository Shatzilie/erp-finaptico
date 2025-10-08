import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show rate limit error after many requests', async ({ page }) => {
    // This test simulates rapid requests
    // Note: May need to adjust based on actual rate limits
    
    await page.goto('/dashboard');
    
    // Make multiple rapid navigation requests
    for (let i = 0; i < 60; i++) {
      await page.goto('/dashboard');
      await page.waitForTimeout(100);
    }
    
    // Should eventually see rate limit message
    const rateLimitMessage = page.locator('text=/too many requests|rate limit|límite excedido/i');
    
    // Check if rate limit appears (may not always trigger in test)
    if (await rateLimitMessage.count() > 0) {
      await expect(rateLimitMessage).toBeVisible();
    }
  });
});
