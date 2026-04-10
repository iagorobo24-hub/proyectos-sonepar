/**
 * Diagnóstico rápido con Playwright
 * Verifica cada página y reporta estado
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function mockAuth(page) {
  await page.addInitScript(u => { window.__PW_MOCK_USER__ = u; }, {
    uid: 'test-123', displayName: 'Test', email: 'test@test.com', photoURL: null
  });
}

test.describe('🔧 Diagnóstico Rápido', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    // Capturar errores de consola
    page.on('pageerror', err => console.error('💥 JS Error:', err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') console.error('🔴 Console:', msg.text());
    });
  });

  test('Verifica TODAS las páginas', async ({ page }) => {
    const pages = [
      { name: 'Fichas Técnicas', path: '/fichas' },
      { name: 'Simulador Almacén', path: '/almacen' },
      { name: 'Dashboard Incidencias', path: '/incidencias' },
      { name: 'KPI Logístico', path: '/kpi' },
      { name: 'Presupuestos', path: '/presupuestos' },
      { name: 'Formación Interna', path: '/formacion' },
      { name: 'SONEX', path: '/sonex' },
    ];

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNÓSTICO DE PÁGINAS');
    console.log('='.repeat(60));

    for (const p of pages) {
      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verificar que no hay pantallazo blanco
        const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
        const hasError = await page.evaluate(() => !!document.querySelector('[role="alert"]') || document.body.innerText.includes('Error'));

        if (hasContent && !hasError) {
          console.log(`✅ ${p.name.padEnd(25)} ${p.path.padEnd(15)} OK`);
        } else {
          console.log(`⚠️  ${p.name.padEnd(25)} ${p.path.padEnd(15)} Contenido limitado`);
        }

        // Screenshot
        await page.screenshot({ path: `e2e/screenshots/diag-${p.path.replace('/', '')}.png`, fullPage: true });

      } catch (err) {
        console.log(`❌ ${p.name.padEnd(25)} ${p.path.padEnd(15)} ERROR: ${err.message.substring(0, 50)}`);
      }
    }

    console.log('='.repeat(60));
    console.log('Screenshots en: e2e/screenshots/diag-*.png');
    console.log('='.repeat(60) + '\n');
  });

  test('Verifica navegación completa', async ({ page }) => {
    await page.goto(`${BASE}/fichas`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);

    // Navegar por todas las herramientas
    const navItems = ['Fichas Técnicas', 'Almacén', 'Incidencias', 'KPI', 'Presupuestos', 'Formación', 'Sonex'];
    
    console.log('\nNavegación:');
    for (const item of navItems) {
      try {
        const btn = page.getByRole('link', { name: item });
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click();
          await page.waitForTimeout(500);
          console.log(`  ✅ ${item}`);
        } else {
          console.log(`  ❌ ${item} - no visible`);
        }
      } catch {
        console.log(`  ❌ ${item} - error`);
      }
    }
  });
});
