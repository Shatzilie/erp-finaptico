import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Multi-tenant Dashboard', () => {
  test('should load dashboard for user with multiple tenants', async ({ page }) => {
    // Login como usuario multi-tenant (fatima@finaptico.com tiene 2 tenants)
    await loginAsUser(page, 'fatima@finaptico.com', 'Tester123!');

    // Esperar a que cargue el dashboard
    await page.waitForSelector('h2:has-text("Indicadores Clave")', { timeout: 10000 });

    // Verificar que NO hay errores 406 o PGRST116 en consola
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Esperar un poco para capturar posibles errores
    await page.waitForTimeout(2000);

    // Verificar que no hay errores de multi-tenant
    const hasMultiTenantError = consoleErrors.some(error => 
      error.includes('PGRST116') || 
      error.includes('The result contains 2 rows') ||
      error.includes('406')
    );

    expect(hasMultiTenantError).toBe(false);

    // Verificar que el dashboard cargó correctamente
    await expect(page.locator('h2:has-text("Indicadores Clave")')).toBeVisible();
    
    // Verificar que se muestra algún KPI
    await expect(page.locator('text=Tesorería')).toBeVisible();
  });

  test('should redirect to correct tenant slug', async ({ page }) => {
    await loginAsUser(page, 'fatima@finaptico.com', 'Tester123!');

    // Esperar redirección automática al primer tenant
    await page.waitForURL(/\/(blacktar|young-minds)\/dashboard/, { timeout: 10000 });

    // Verificar que la URL contiene un tenant válido
    const url = page.url();
    const hasValidTenant = url.includes('/blacktar/') || url.includes('/young-minds/');
    expect(hasValidTenant).toBe(true);
  });

  test('should handle access denied for invalid tenant', async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'TestPassword123!');

    // Intentar acceder a un tenant que no existe o no tiene permiso
    await page.goto('/invalid-tenant/dashboard');

    // Debería mostrar error de acceso denegado O redirigir a login
    const isAccessDenied = await page.locator('text=Acceso Denegado').isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');

    expect(isAccessDenied || isLoginPage).toBe(true);
  });
});
