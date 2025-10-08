import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Logout
    await page.click('button:has-text("Cerrar sesión"), button:has-text("Logout")');
    await expect(page).toHaveURL(/.*login/);
  });
});
