import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function logout(page: Page) {
  await page.click('button:has-text("Cerrar sesión"), button:has-text("Logout")');
}
