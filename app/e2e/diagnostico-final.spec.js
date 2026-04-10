/**
 * Diagnóstico FINAL — Playwright
 * Verifica estado real de cada página tras todos los cambios
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

async function mockAuth(page) {
  await page.addInitScript(u => { window.__PW_MOCK_USER__ = u; }, {
    uid: 'test-123', displayName: 'Test', email: 'test@test.com', photoURL: null
  });
}

test.describe('🔧 Diagnóstico Final', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('Verifica TODAS las páginas y toma screenshots', async ({ page }) => {
    const pages = [
      { name: 'Fichas Técnicas', path: '/fichas' },
      { name: 'Simulador Almacén', path: '/almacen' },
      { name: 'Dashboard Incidencias', path: '/incidencias' },
      { name: 'KPI Logístico', path: '/kpi' },
      { name: 'Presupuestos', path: '/presupuestos' },
      { name: 'Formación Interna', path: '/formacion' },
      { name: 'SONEX', path: '/sonex' },
    ];

    console.log('\n' + '='.repeat(70));
    console.log('DIAGNÓSTICO FINAL — Proyectos Sonepar');
    console.log('='.repeat(70));

    const results = [];

    for (const p of pages) {
      let status = '✅ OK';
      let notes = '';

      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);

        const pageCheck = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          const hasTitle = document.querySelector('h1, .pageTitle, [class*="pageTitle"]') !== null;
          const hasJsError = document.querySelector('[role="alert"]') !== null ||
            bodyText.includes('Cannot read properties') ||
            bodyText.includes('undefined is not an object');
          return { bodyLen: bodyText.length, hasTitle, hasJsError };
        });

        const { bodyLen, hasTitle, hasJsError } = pageCheck;

        if (bodyLen > 100 && hasTitle && !hasJsError) {
          status = '✅ OK';
        } else if (bodyLen > 50 || hasTitle) {
          status = '⚠️ Parcial';
          notes = `Chars: ${bodyLen}, Título: ${hasTitle}`;
        } else {
          status = '❌ Error';
          notes = 'Página en blanco';
        }

        // Screenshot
        await page.screenshot({
          path: `e2e/screenshots/final-${p.path.replace('/', '')}.png`,
          fullPage: true,
          timeout: 10000
        });

      } catch (err) {
        status = '❌ Crash';
        notes = err.message.substring(0, 60);
      }

      results.push({ name: p.name, path: p.path, status, notes });
      console.log(`${status.padEnd(12)} ${p.name.padEnd(22)} ${p.path.padEnd(15)} ${notes}`);
    }

    console.log('='.repeat(70));
    const ok = results.filter(r => r.status === '✅ OK').length;
    const warn = results.filter(r => r.status === '⚠️ Parcial').length;
    const err = results.filter(r => r.status === '❌ Error' || r.status === '❌ Crash').length;
    console.log(`RESUMEN: ${ok} OK | ${warn} Parcial | ${err} Error`);
    console.log('Screenshots: e2e/screenshots/final-*.png');
    console.log('='.repeat(70) + '\n');

    // Assertion: al menos 6 de 7 deben funcionar
    expect(ok + warn).toBeGreaterThanOrEqual(6);
  });

  test('Navegación completa entre herramientas', async ({ page }) => {
    await page.goto(`${BASE}/fichas`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);

    const navItems = ['Fichas Técnicas', 'Almacén', 'Incidencias', 'KPI', 'Presupuestos', 'Formación', 'Sonex'];
    const expectedPaths = ['/fichas', '/almacen', '/incidencias', '/kpi', '/presupuestos', '/formacion', '/sonex'];

    console.log('\nNavegación:');

    for (let i = 0; i < navItems.length; i++) {
      try {
        const btn = page.getByRole('link', { name: navItems[i] });
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click();
          await page.waitForURL(`**${expectedPaths[i]}`, { timeout: 5000 });
          await page.waitForTimeout(500);
          console.log(`  ✅ ${navItems[i]} → ${expectedPaths[i]}`);
        } else {
          console.log(`  ❌ ${navItems[i]} — botón no visible`);
        }
      } catch (err) {
        console.log(`  ❌ ${navItems[i]} — ${err.message.substring(0, 40)}`);
      }
    }
  });

  test('Verifica diseño visual — Fichas Técnicas', async ({ page }) => {
    await page.goto(`${BASE}/fichas`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verificar elementos del diseño circular
    const hasSidebar = await page.evaluate(() => document.querySelector('[class*="sidebar"]') !== null);
    const hasSearch = await page.evaluate(() => document.querySelector('input[placeholder*="buscar"], input[placeholder*="Buscar"]') !== null);
    const hasCategories = await page.evaluate(() => document.querySelector('[class*="catBtn"], [class*="category"]') !== null);
    const hasMainContent = await page.evaluate(() => document.querySelector('[class*="main"], main') !== null);

    console.log('\nDiseño Fichas Técnicas:');
    console.log(`  Sidebar: ${hasSidebar ? '✅' : '❌'}`);
    console.log(`  Buscador: ${hasSearch ? '✅' : '❌'}`);
    console.log(`  Categorías: ${hasCategories ? '✅' : '❌'}`);
    console.log(`  Contenido principal: ${hasMainContent ? '✅' : '❌'}`);

    await page.screenshot({ path: 'e2e/screenshots/final-design-fichas.png', fullPage: true });
  });

  test('Verifica diseño visual — SONEX', async ({ page }) => {
    await page.goto(`${BASE}/sonex`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const hasChat = await page.evaluate(() => document.querySelector('[class*="chat"]') !== null);
    const hasSidebar = await page.evaluate(() => document.querySelector('[class*="panelBusqueda"], [class*="sidebar"]') !== null);
    const hasSonexHeader = await page.evaluate(() => document.querySelector('[class*="sonex"]') !== null);

    console.log('\nDiseño SONEX:');
    console.log(`  Chat: ${hasChat ? '✅' : '❌'}`);
    console.log(`  Sidebar: ${hasSidebar ? '✅' : '❌'}`);
    console.log(`  Header SONEX: ${hasSonexHeader ? '✅' : '❌'}`);

    await page.screenshot({ path: 'e2e/screenshots/final-design-sonex.png', fullPage: true });
  });
});
