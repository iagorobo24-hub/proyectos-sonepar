/**
 * Playwright E2E — Análisis completo de Proyectos Sonepar
 * Tests visuales + funcionales de TODAS las herramientas
 * 
 * Uso: npx playwright test e2e/analisis-completo.spec.js --headed
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Mock user para bypass auth en desarrollo
const MOCK_USER = {
  uid: 'test-user-123',
  displayName: 'Usuario Test',
  email: 'test@sonepar.es',
  photoURL: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupMockAuth(page) {
  await page.addInitScript(user => {
    window.__PW_MOCK_USER__ = user;
  }, MOCK_USER);
}

async function takeFullScreenshot(page, name) {
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true,
  });
}

async function checkElementVisible(page, selector, description) {
  try {
    await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
    return { ok: true, msg: `✅ ${description} visible` };
  } catch {
    return { ok: false, msg: `❌ ${description} NO visible` };
  }
}

async function checkPageLoad(page, url, name) {
  await page.goto(url, { waitUntil: 'networkidle' });
  const results = [];
  results.push({ ok: true, msg: `📄 ${name} cargada en ${url}` });
  
  // Check for JS errors
  page.on('pageerror', err => results.push({ ok: false, msg: `💥 Error JS: ${err.message}` }));
  page.on('console', msg => {
    if (msg.type() === 'error') results.push({ ok: false, msg: `🔴 Console error: ${msg.text()}` });
  });
  
  return results;
}

// ── Test Suite: Análisis Completo ────────────────────────────────────────────

test.describe('🔍 Análisis Completo — Proyectos Sonepar', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  // ═══════════════════════════════════════════════════════
  // 1. LOGIN
  // ═══════════════════════════════════════════════════════
  test.describe('1. Login', () => {
    test('Página de login carga correctamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      
      // Verificar elementos del login
      await expect(page.getByText('Sonepar')).toBeVisible();
      await expect(page.getByText('Tools')).toBeVisible();
      await expect(page.getByText('Inicia sesión')).toBeVisible();
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      
      await takeFullScreenshot(page, '01-login');
    });

    test('Redirección automática tras login (mock)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForURL(/\/fichas/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/fichas/);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. TOPBAR & NAVEGACIÓN
  // ═══════════════════════════════════════════════════════
  test.describe('2. Topbar & Navegación', () => {
    test('Topbar visible con todas las herramientas', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      const tools = ['Fichas Técnicas', 'Almacén', 'Incidencias', 'KPI', 'Presupuestos', 'Formación', 'Sonex'];
      for (const tool of tools) {
        await expect(page.getByRole('link', { name: tool })).toBeVisible();
      }
      
      // Usuario visible
      await expect(page.getByText('Usuario Test')).toBeVisible();
      await takeFullScreenshot(page, '02-topbar');
    });

    test('Navegación entre todas las herramientas', async ({ page }) => {
      const routes = [
        { name: 'Fichas Técnicas', path: '/fichas', active: 'Fichas Técnicas' },
        { name: 'Simulador Almacén', path: '/almacen', active: 'Almacén' },
        { name: 'Dashboard Incidencias', path: '/incidencias', active: 'Incidencias' },
        { name: 'KPI Logístico', path: '/kpi', active: 'KPI' },
        { name: 'Presupuestos', path: '/presupuestos', active: 'Presupuestos' },
        { name: 'Formación Interna', path: '/formacion', active: 'Formación' },
        { name: 'SONEX', path: '/sonex', active: 'Sonex' },
      ];

      for (const route of routes) {
        await page.click(`a:has-text("${route.active}")`);
        await page.waitForURL(`**${route.path}`, { timeout: 5000 });
        await expect(page).toHaveURL(new RegExp(route.path));
        await takeFullScreenshot(page, `02-nav-${route.name.replace(/\s+/g, '-').toLowerCase()}`);
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. FICHAS TÉCNICAS — Layout Circular
  // ═══════════════════════════════════════════════════════
  test.describe('3. Fichas Técnicas', () => {
    test('Layout circular — centro con descripción', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Verificar sidebar de categorías
      await expect(page.getByText('Categorías')).toBeVisible();
      await expect(page.getByText('Variadores')).toBeVisible();
      await expect(page.getByText('Contactores')).toBeVisible();
      await expect(page.getByText('PLCs')).toBeVisible();
      
      // Verificar búsqueda
      await expect(page.getByPlaceholder(/buscar/i)).toBeVisible();
      
      // Verificar layout principal
      await expect(page.getByText('Fichas Técnicas')).toBeVisible();
      
      await takeFullScreenshot(page, '03-fichas-main');
    });

    test('Navegación por categorías', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Click en Variadores
      await page.click('button:has-text("Variadores")');
      await expect(page.getByText('Elige marca')).toBeVisible();
      
      // Verificar marcas con logos
      await expect(page.getByText('Schneider Electric')).toBeVisible();
      await expect(page.getByText('ABB')).toBeVisible();
      await expect(page.getByText('Mitsubishi Electric')).toBeVisible();
      
      await takeFullScreenshot(page, '03-fichas-marcas');
      
      // Click en Schneider
      await page.click('button:has-text("Schneider Electric")');
      await expect(page.getByText('Elige gama')).toBeVisible();
      
      await takeFullScreenshot(page, '03-fichas-gamas');
    });

    test('Búsqueda por referencia', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Buscar referencia directa
      await page.fill('input[placeholder*="buscar"]', 'ATV320');
      await page.keyboard.press('Enter');
      
      // Esperar respuesta IA
      await page.waitForTimeout(3000);
      
      await takeFullScreenshot(page, '03-fichas-busqueda');
    });

    test('Ficha técnica — detalle completo', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Navegar hasta ficha
      await page.click('button:has-text("Variadores")');
      await page.click('button:has-text("Schneider Electric")');
      await page.click('button:has-text("ATV320")');
      
      // Esperar a que aparezcan referencias
      await page.waitForTimeout(1000);
      
      // Click en primera referencia
      const refCards = await page.locator('[class*="refCard"]').all();
      if (refCards.length > 0) {
        await refCards[0].click();
        await page.waitForTimeout(1000);
      }
      
      await takeFullScreenshot(page, '03-fichas-detalle');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. SIMULADOR ALMACÉN
  // ═══════════════════════════════════════════════════════
  test.describe('4. Simulador Almacén', () => {
    test('Página de perfil', async ({ page }) => {
      await page.goto(`${BASE_URL}/almacen`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('Simulador Almacén')).toBeVisible();
      await expect(page.getByText('Perfil del operario')).toBeVisible();
      
      // Completar perfil
      await page.fill('input[placeholder*="Tu nombre"]', 'Test User');
      await page.click('button:has-text("Continuar")');
      
      await takeFullScreenshot(page, '04-almacen-perfil');
    });

    test('Onboarding — selección de modo', async ({ page }) => {
      await page.goto(`${BASE_URL}/almacen`, { waitUntil: 'networkidle' });
      await page.fill('input[placeholder*="Tu nombre"]', 'Test User');
      await page.click('button:has-text("Continuar")');
      await page.waitForTimeout(1000);
      
      await expect(page.getByText('Entrenamiento')).toBeVisible();
      await expect(page.getByText('Evaluación')).toBeVisible();
      
      await takeFullScreenshot(page, '04-almacen-modos');
    });

    test('Simulación — etapas y timer', async ({ page }) => {
      await page.goto(`${BASE_URL}/almacen`, { waitUntil: 'networkidle' });
      await page.fill('input[placeholder*="Tu nombre"]', 'Test User');
      await page.click('button:has-text("Continuar")');
      await page.waitForTimeout(1000);
      
      // Iniciar entrenamiento
      await page.click('button:has-text("Entrenamiento")');
      await page.waitForTimeout(1000);
      
      // Verificar timer
      await expect(page.locator('[class*="timer"]')).toBeVisible();
      
      // Completar etapa
      await page.click('button:has-text("Completar")');
      await page.waitForTimeout(2000);
      
      await takeFullScreenshot(page, '04-almacen-simulacion');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 5. DASHBOARD INCIDENCIAS
  // ═══════════════════════════════════════════════════════
  test.describe('5. Dashboard Incidencias', () => {
    test('KPIs y lista de incidencias', async ({ page }) => {
      await page.goto(`${BASE_URL}/incidencias`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('Dashboard Incidencias')).toBeVisible();
      
      // Verificar KPIs
      await expect(page.getByText('Críticas')).toBeVisible();
      await expect(page.getByText('Abiertas')).toBeVisible();
      await expect(page.getByText('Resueltas')).toBeVisible();
      
      // Verificar lista
      await expect(page.getByText('Variador ATV320')).toBeVisible();
      
      await takeFullScreenshot(page, '05-incidencias-main');
    });

    test('Nueva incidencia', async ({ page }) => {
      await page.goto(`${BASE_URL}/incidencias`, { waitUntil: 'networkidle' });
      
      // Cambiar a tab Nueva
      await page.click('button:has-text("Nueva")');
      
      await expect(page.getByText('Registrar nueva incidencia')).toBeVisible();
      
      // Rellenar formulario
      await page.fill('input[placeholder*="Variador"]', 'Motor trifásico 5.5kW');
      await page.fill('input[placeholder*="Nombre del operario"]', 'Juan García');
      await page.fill('textarea[placeholder*="Describe"]', 'El motor se sobrecalienta tras 30 minutos');
      
      await page.click('button:has-text("Registrar incidencia")');
      await page.waitForTimeout(1000);
      
      await takeFullScreenshot(page, '05-incidencias-nueva');
    });

    test('Detalle de incidencia', async ({ page }) => {
      await page.goto(`${BASE_URL}/incidencias`, { waitUntil: 'networkidle' });
      
      // Click en primera incidencia
      await page.click('[class*="incidenciaItem"]');
      await page.waitForTimeout(1000);
      
      // Verificar diagnóstico IA
      await expect(page.getByText('Diagnóstico IA')).toBeVisible();
      
      // Generar diagnóstico
      await page.click('button:has-text("Generar diagnóstico")');
      await page.waitForTimeout(5000);
      
      await takeFullScreenshot(page, '05-incidencias-detalle');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 6. KPI LOGÍSTICO
  // ═══════════════════════════════════════════════════════
  test.describe('6. KPI Logístico', () => {
    test('Formulario de datos', async ({ page }) => {
      await page.goto(`${BASE_URL}/kpi`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('KPI Logístico')).toBeVisible();
      
      // Rellenar datos
      await page.fill('input[placeholder="145"]', '150');
      await page.fill('input[placeholder="8"]', '8');
      await page.fill('input[placeholder="6"]', '6');
      await page.fill('input[placeholder="420"]', '450');
      await page.fill('input[placeholder="3"]', '2');
      await page.fill('input[placeholder="4.2"]', '3.8');
      await page.fill('input[placeholder="8750"]', '9000');
      await page.fill('input[placeholder="12000"]', '12000');
      await page.fill('input[placeholder="7"]', '5');
      
      await takeFullScreenshot(page, '06-kpi-form');
    });

    test('Cálculo de KPIs', async ({ page }) => {
      await page.goto(`${BASE_URL}/kpi`, { waitUntil: 'networkidle' });
      
      // Rellenar datos mínimos
      await page.fill('input[placeholder="145"]', '150');
      await page.fill('input[placeholder="8"]', '8');
      await page.fill('input[placeholder="420"]', '450');
      await page.fill('input[placeholder="3"]', '2');
      await page.fill('input[placeholder="4.2"]', '3.8');
      await page.fill('input[placeholder="8750"]', '9000');
      await page.fill('input[placeholder="12000"]', '12000');
      await page.fill('input[placeholder="7"]', '5');
      await page.fill('input[placeholder="6"]', '6');
      
      await page.click('button:has-text("Calcular")');
      await page.waitForTimeout(5000);
      
      // Verificar KPIs
      await expect(page.locator('[class*="kpiCard"]')).toHaveCount(6);
      
      await takeFullScreenshot(page, '06-kpi-resultados');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 7. PRESUPUESTOS
  // ═══════════════════════════════════════════════════════
  test.describe('7. Presupuestos', () => {
    test('Wizard de categorías', async ({ page }) => {
      await page.goto(`${BASE_URL}/presupuestos`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('Presupuestos')).toBeVisible();
      await expect(page.getByText('Automatización')).toBeVisible();
      await expect(page.getByText('Iluminación')).toBeVisible();
      await expect(page.getByText('Vehículo Eléctrico')).toBeVisible();
      
      await takeFullScreenshot(page, '07-presupuestos-wizard');
    });

    test('Editor de partidas', async ({ page }) => {
      await page.goto(`${BASE_URL}/presupuestos`, { waitUntil: 'networkidle' });
      
      // Seleccionar categoría
      await page.click('button:has-text("Automatización")');
      await page.waitForTimeout(1000);
      
      // Verificar formulario de respuestas
      await expect(page.getByText('potencia')).toBeVisible();
      
      await takeFullScreenshot(page, '07-presupuestos-form');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 8. FORMACIÓN INTERNA
  // ═══════════════════════════════════════════════════════
  test.describe('8. Formación Interna', () => {
    test('Dashboard de equipo', async ({ page }) => {
      await page.goto(`${BASE_URL}/formacion`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('Formación Interna')).toBeVisible();
      
      // Verificar KPIs
      await expect(page.getByText('Progreso global')).toBeVisible();
      await expect(page.getByText('Empleados')).toBeVisible();
      
      // Verificar lista de empleados
      await expect(page.getByText('María Fernández')).toBeVisible();
      
      await takeFullScreenshot(page, '08-formacion-dashboard');
    });

    test('Detalle de empleado', async ({ page }) => {
      await page.goto(`${BASE_URL}/formacion`, { waitUntil: 'networkidle' });
      
      // Click en empleado
      await page.click('button:has-text("María Fernández")');
      await page.waitForTimeout(1000);
      
      // Verificar módulos
      await expect(page.getByText('Almacén')).toBeVisible();
      await expect(page.getByText('Recepción de mercancía')).toBeVisible();
      
      await takeFullScreenshot(page, '08-formacion-detalle');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 9. SONEX
  // ═══════════════════════════════════════════════════════
  test.describe('9. SONEX', () => {
    test('Chat interface', async ({ page }) => {
      await page.goto(`${BASE_URL}/sonex`, { waitUntil: 'networkidle' });
      
      await expect(page.getByText('SONEX')).toBeVisible();
      await expect(page.getByText('Asistente técnico')).toBeVisible();
      
      // Verificar sidebar
      await expect(page.getByText('Búsqueda')).toBeVisible();
      await expect(page.getByText('Automatización')).toBeVisible();
      
      // Verificar sugerencias
      await expect(page.getByText('SUGERENCIAS')).toBeVisible();
      
      await takeFullScreenshot(page, '09-sonex-main');
    });

    test('Enviar mensaje a SONEX', async ({ page }) => {
      await page.goto(`${BASE_URL}/sonex`, { waitUntil: 'networkidle' });
      
      // Escribir mensaje
      await page.fill('textarea[placeholder*="consulta"]', '¿Qué variador recomiendas para un motor 2.2kW?');
      await page.keyboard.press('Enter');
      
      // Esperar respuesta
      await page.waitForTimeout(8000);
      
      // Verificar respuesta
      await expect(page.locator('[class*="message--assistant"]')).toBeVisible();
      
      await takeFullScreenshot(page, '09-sonex-chat');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 10. RESPONSIVE
  // ═══════════════════════════════════════════════════════
  test.describe('10. Responsive', () => {
    test('Tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      await takeFullScreenshot(page, '10-responsive-tablet');
    });

    test('Mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      await takeFullScreenshot(page, '10-responsive-mobile');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 11. DARK MODE
  // ═══════════════════════════════════════════════════════
  test.describe('11. Dark Mode', () => {
    test('Toggle dark mode', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Click en toggle dark mode
      await page.click('button:has-text("Oscuro")');
      await page.waitForTimeout(500);
      
      await takeFullScreenshot(page, '11-dark-mode');
      
      // Verificar que el fondo cambió
      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor;
      });
      
      // El fondo debería ser oscuro
      expect(bgColor).not.toBe('rgb(244, 246, 251)'); // No debería ser el color claro
    });
  });

  // ═══════════════════════════════════════════════════════
  // 12. PERFORMANCE
  // ═══════════════════════════════════════════════════════
  test.describe('12. Performance', () => {
    test('Lighthouse — Core Web Vitals', async ({ page }) => {
      await page.goto(`${BASE_URL}/fichas`, { waitUntil: 'networkidle' });
      
      // Medir First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntriesByName('first-contentful-paint');
            if (entries.length > 0) resolve(entries[0].startTime);
          });
          observer.observe({ type: 'paint', buffered: true });
        });
      });
      
      console.log(`📊 First Contentful Paint: ${Math.round(fcp)}ms`);
      
      // Medir Largest Contentful Paint
      const lcp = await page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            if (entries.length > 0) resolve(entries[entries.length - 1].startTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
        });
      });
      
      console.log(`📊 Largest Contentful Paint: ${Math.round(lcp)}ms`);
      
      expect(fcp).toBeLessThan(3000); // FCP < 3s
    });
  });
});
