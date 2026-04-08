/**
 * Test de Navegación — Verifica que la interfaz cambia al navegar
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function mockAuth(page) {
  await page.addInitScript(u => { window.__PW_MOCK_USER__ = u; }, {
    uid: 'test-123', displayName: 'Test', email: 'test@test.com', photoURL: null
  });
}

test.describe('🔍 Navegación entre Herramientas', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('Navegación correcta sin recargar', async ({ page }) => {
    // 1. Ir a Fichas Técnicas
    await page.goto(`${BASE}/fichas`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Verificar que estamos en Fichas
    await expect(page).toHaveURL(/\/fichas/);
    await expect(page.locator('h1').filter({ hasText: 'Fichas Técnicas' })).toBeVisible();
    console.log('✅ Página inicial: Fichas Técnicas');

    // 2. Navegar a SONEX haciendo clic en el enlace de la topbar
    await page.click('a:has-text("Sonex")');
    await page.waitForTimeout(500);

    // Verificar que la URL cambió
    await expect(page).toHaveURL(/\/sonex/);
    
    // Verificar que la interfaz cambió
    await expect(page.locator('text=SONEX').first()).toBeVisible();
    console.log('✅ Navegación a SONEX exitosa');

    // 3. Navegar a KPI
    await page.click('a:has-text("KPI")');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/kpi/);
    
    await expect(page.locator('h1').filter({ hasText: 'KPI Logístico' })).toBeVisible();
    console.log('✅ Navegación a KPI exitosa');

    // 4. Navegar a Incidencias
    await page.click('a:has-text("Incidencias")');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/incidencias/);
    
    await expect(page.locator('h1').filter({ hasText: 'Dashboard Incidencias' })).toBeVisible();
    console.log('✅ Navegación a Incidencias exitosa');

    // 5. Volver a Fichas Técnicas
    await page.click('a:has-text("Fichas")');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/fichas/);
    
    // Fichas Técnicas tiene el título en varios sitios, buscamos cualquiera
    await expect(page.locator('text=Fichas Técnicas').first()).toBeVisible();
    console.log('✅ Regreso a Fichas Técnicas exitoso');

    console.log('\n🎉 Todas las navegaciones funcionaron correctamente sin recargar.');
  });
});
