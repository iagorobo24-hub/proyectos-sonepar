import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:5173';

test.describe('Verificacion Visual Completa', () => {

  test('1. Landing page carga con hero visible', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(3000);
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 10000 });
    const titleText = await title.textContent();
    console.log('Hero title:', titleText);
    expect(titleText && titleText.length > 0).toBeTruthy();
  });

  test('2. Dashboard Incidencias - KPIs en fila y filtros en cuadros', async ({ page }) => {
    await page.goto(`${BASE}/app/incidencias`);
    await page.waitForTimeout(3000);
    
    // Verificar que hay 4 cards de KPI
    const kpiGrid = page.locator('[class*="kpiGrid"]');
    await expect(kpiGrid).toBeVisible({ timeout: 10000 });
    
    // Verificar que existen filtros
    const filtrosBlock = page.locator('[class*="filtrosBlock"]');
    const filtroGrupos = page.locator('[class*="filtroGrupo"]');
    await expect(filtroGrupos.first()).toBeVisible({ timeout: 5000 });
    
    // Verificar que filtros tienen fondo/borde (estilo cuadro)
    const firstFiltro = filtroGrupos.first();
    const bg = await firstFiltro.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const border = await firstFiltro.evaluate(el => window.getComputedStyle(el).border);
    console.log('Filtro background:', bg);
    console.log('Filtro border:', border);
    expect(bg && bg !== 'rgba(0, 0, 0, 0)').toBeTruthy();
  });

  test('3. KPIs - Boton visible y cargar ejemplo', async ({ page }) => {
    await page.goto(`${BASE}/app/kpi`);
    await page.waitForTimeout(3000);
    
    // Botón calcular visible sin hover
    const calcBtn = page.getByRole('button', { name: /Calcular/i });
    await expect(calcBtn).toBeVisible({ timeout: 10000 });
    const opacity = await calcBtn.evaluate(el => window.getComputedStyle(el).opacity);
    console.log('Botón calcular opacity:', opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.5);
    
    // Botón cargar ejemplo
    const ejemploBtn = page.getByRole('button', { name: /ejemplo/i });
    await expect(ejemploBtn).toBeVisible({ timeout: 5000 });
  });

  test('4. Fichas Tecnicas - buscador sidebar visible con recuadro', async ({ page }) => {
    await page.goto(`${BASE}/app/fichas`);
    await page.waitForTimeout(3000);
    
    // Verificar que existe un input de búsqueda en el sidebar
    const searchInput = page.locator('input[placeholder="Buscar referencia..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Verificar que tiene borde visible
    const border = await searchInput.evaluate(el => window.getComputedStyle(el).border);
    console.log('Search input border:', border);
    expect(border && border.includes('1.5px')).toBeTruthy();
    
    // Verificar que hay sidebar con categorías
    const sidebar = page.locator('[class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('5. Presupuestos - flujo categoria > continuar', async ({ page }) => {
    await page.goto(`${BASE}/app/presupuestos`);
    await page.waitForTimeout(3000);
    
    // Verificar que hay categorías
    const titulo = page.getByRole('heading', { name: /Presupuestos/i });
    await expect(titulo).toBeVisible({ timeout: 10000 });
    
    // Seleccionar primera categoría
    const catBtns = page.locator('[class*="catCard"]');
    const count = await catBtns.count();
    expect(count).toBeGreaterThan(0);
    console.log('Categorías disponibles:', count);
    
    // Click en primera categoría
    await catBtns.first().click();
    await page.waitForTimeout(1000);
    
    // Verificar que aparece botón "Ver catálogo" o "Continuar"
    const continuarBtn = page.getByRole('button', { name: /catálogo|Continuar/i });
    await expect(continuarBtn).toBeVisible({ timeout: 5000 });
    
    // Click para ir a selección
    await continuarBtn.click();
    await page.waitForTimeout(2000);
    
    // Verificar que hay productos en grid
    const productCards = page.locator('[class*="productCard"]');
    const productCount = await productCards.count();
    console.log('Productos en catálogo:', productCount);
    expect(productCount).toBeGreaterThan(0);
  });

  test('6. Simulador Almacen - inputs estilizados y boton visible', async ({ page }) => {
    await page.goto(`${BASE}/app/almacen`);
    await page.waitForTimeout(3000);
    
    // Verificar que hay formulario de perfil
    const nombreInput = page.locator('input[placeholder="Tu nombre"]');
    await expect(nombreInput).toBeVisible({ timeout: 10000 });
    
    // Verificar que input tiene borde
    const border = await nombreInput.evaluate(el => window.getComputedStyle(el).border);
    console.log('Input perfil border:', border);
    
    // Botón iniciar simulación visible
    const iniciarBtn = page.getByRole('button', { name: /Iniciar simulación|Continuar/i });
    await expect(iniciarBtn).toBeVisible({ timeout: 5000 });
  });

  test('7. Formación Interna - solo 2 tabs, KPIs en fila', async ({ page }) => {
    await page.goto(`${BASE}/app/formacion`);
    await page.waitForTimeout(3000);
    
    // Verificar tabs (solo Equipo y Ajustes)
    const tabs = page.locator('[class*="viewToggle__btn"]');
    const tabCount = await tabs.count();
    console.log('Número de tabs:', tabCount);
    expect(tabCount).toBe(2);
    
    // Verificar KPIs grid
    const kpiGrid = page.locator('[class*="kpiGrid"]');
    await expect(kpiGrid).toBeVisible({ timeout: 5000 });
    
    // Verificar 4 KPI cards
    const kpiCards = kpiGrid.locator('[class*="kpiCard"]');
    const kpiCount = await kpiCards.count();
    console.log('KPI cards:', kpiCount);
    expect(kpiCount).toBe(4);
  });

  test('8. Sonex - chat visible', async ({ page }) => {
    await page.goto(`${BASE}/app/sonex`);
    await page.waitForTimeout(3000);
    
    const chatArea = page.locator('[class*="chatContainer"], [class*="chat"]').first();
    await expect(chatArea).toBeVisible({ timeout: 10000 });
    
    const inputArea = page.locator('textarea').first();
    await expect(inputArea).toBeVisible({ timeout: 5000 });
  });

});
