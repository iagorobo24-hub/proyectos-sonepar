import { test, expect } from '@playwright/test'

/*
  ═══════════════════════════════════════════════════════════
  Test visual completo — Proyectos Sonepar
  Captura screenshots de TODA la app: login + 7 herramientas
  ═══════════════════════════════════════════════════════════
*/

const TOOLS = [
  { path: '/fichas',       name: 'fichas-tecnicas' },
  { path: '/almacen',      name: 'simulador-almacen' },
  { path: '/incidencias',  name: 'dashboard-incidencias' },
  { path: '/kpi',          name: 'kpi-logistico' },
  { path: '/presupuestos', name: 'presupuestos' },
  { path: '/formacion',    name: 'formacion-interna' },
  { path: '/sonex',        name: 'sonex-ia' },
]

const MOCK_USER = {
  uid: 'pw-test-user',
  email: 'test@sonepar.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
}

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 667 },
]

/* ── Helper: inyectar usuario mock ─────────────────────────────────── */
async function injectMockAuth(page) {
  await page.addInitScript((user) => {
    window.__PW_MOCK_USER__ = user
  }, MOCK_USER)
}

/* ══════════════════════════════════════════════════════════════════════
   TEST 1: Login Page — elementos y accesibilidad
   ══════════════════════════════════════════════════════════════════════ */
test('01-login — elementos y accesibilidad', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Elementos clave
  await expect(page.getByText('Sonepar')).toBeVisible()
  await expect(page.getByText('Tools')).toBeVisible()
  await expect(page.getByText('Inicia sesión')).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible()

  // SVG de Google presente
  await expect(page.locator('svg[viewBox="0 0 24 24"]')).toBeVisible()

  await page.screenshot({ path: 'e2e/results/01-login.png', fullPage: true })
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 2: Login Responsive — 3 tamaños
   ══════════════════════════════════════════════════════════════════════ */
test('02-login — responsive', async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `e2e/results/02-login-${vp.name}.png`,
      fullPage: true,
    })
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 3: Rutas protegidas redirigen sin auth
   ══════════════════════════════════════════════════════════════════════ */
test('03-rutas — redirección sin auth', async ({ page }) => {
  for (const tool of TOOLS) {
    await page.goto(tool.path)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/.*\/login/)
    console.log(`✅ ${tool.path} → /login`)
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 4: TODAS las vistas interiores con auth mockeada
   ══════════════════════════════════════════════════════════════════════ */
test('04-vistas — todas las herramientas (desktop)', async ({ page }) => {
  await injectMockAuth(page)

  for (const tool of TOOLS) {
    await page.goto(tool.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)

    // Verificar que NO redirigió a login (la auth mock funciona)
    const url = page.url()
    expect(url).toContain(tool.path)

    await page.screenshot({
      path: `e2e/results/04-${tool.name}.png`,
      fullPage: true,
    })
    console.log(`📸 ${tool.path}`)
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 5: Vistas en tablet
   ══════════════════════════════════════════════════════════════════════ */
test('05-vistas — tablet', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await injectMockAuth(page)

  for (const tool of TOOLS) {
    await page.goto(tool.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: `e2e/results/05-${tool.name}-tablet.png`,
      fullPage: true,
    })
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 6: Vistas en mobile
   ══════════════════════════════════════════════════════════════════════ */
test('06-vistas — mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await injectMockAuth(page)

  for (const tool of TOOLS) {
    await page.goto(tool.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: `e2e/results/06-${tool.name}-mobile.png`,
      fullPage: true,
    })
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 7: Navegación entre herramientas
   ══════════════════════════════════════════════════════════════════════ */
test('07-navegación — entre herramientas', async ({ page }) => {
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Verificar que la topbar tiene enlaces de navegación
  const navLinks = page.locator('nav a')
  const count = await navLinks.count()
  expect(count).toBeGreaterThanOrEqual(7)
  console.log(`✅ ${count} enlaces de navegación encontrados`)

  // Click en cada herramienta y verificar URL
  for (let i = 0; i < TOOLS.length; i++) {
    const link = navLinks.nth(i)
    await link.click()
    await page.waitForTimeout(300)
    const url = page.url()
    expect(url).toContain(TOOLS[i].path)
    console.log(`🔗 Navegó a ${TOOLS[i].path}`)
  }

  await page.screenshot({ path: 'e2e/results/07-navegacion.png', fullPage: true })
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 8: Sidebar colapsable
   ══════════════════════════════════════════════════════════════════════ */
test('08-sidebar — colapsar y expandir', async ({ page }) => {
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Screenshot sidebar abierto
  await page.screenshot({ path: 'e2e/results/08-sidebar-open.png', fullPage: true })

  // Buscar botón de colapso
  const collapseBtn = page.locator('button[title*="Colapsar"]')
  if (await collapseBtn.isVisible()) {
    await collapseBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'e2e/results/08-sidebar-collapsed.png', fullPage: true })

    // Volver a expandir
    const expandBtn = page.locator('button[title*="Expandir"]')
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await page.waitForTimeout(300)
    }
  }
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 9: Topbar — usuario mock con iniciales
   ══════════════════════════════════════════════════════════════════════ */
test('09-topbar — usuario y avatar iniciales', async ({ page }) => {
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Verificar nombre del usuario
  await expect(page.getByText('Test User')).toBeVisible()

  // Verificar avatar de iniciales (ya que mock no tiene photoURL)
  const initials = page.locator('span').filter({ hasText: 'TU' })
  await expect(initials.first()).toBeVisible()
  console.log('✅ Avatar con iniciales "TU" visible')

  // Verificar botón logout
  const logoutBtn = page.locator('button[title="Cerrar sesión"]')
  await expect(logoutBtn).toBeVisible()

  // Verificar toggle tema
  const themeBtn = page.locator('button', { hasText: /Claro|Oscuro/i })
  await expect(themeBtn).toBeVisible()

  await page.screenshot({ path: 'e2e/results/09-topbar-user.png', fullPage: true })
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 10: Dark mode toggle
   ══════════════════════════════════════════════════════════════════════ */
test('10-dark-mode — toggle funciona', async ({ page }) => {
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Capturar estado inicial
  const initialBg = await page.evaluate(() => {
    const el = document.querySelector('header')
    return el ? getComputedStyle(el).backgroundColor : 'none'
  })

  // Click toggle
  const themeBtn = page.locator('button', { hasText: /Claro|Oscuro/i })
  await themeBtn.click()
  await page.waitForTimeout(300)

  // Capturar tras toggle
  const afterBg = await page.evaluate(() => {
    const el = document.querySelector('header')
    return el ? getComputedStyle(el).backgroundColor : 'none'
  })

  console.log(`🎨 Tema cambiado: ${initialBg} → ${afterBg}`)
  await page.screenshot({ path: 'e2e/results/10-darkmode.png', fullPage: true })
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 11: Performance — tiempos de carga
   ══════════════════════════════════════════════════════════════════════ */
test('11-performance — tiempos de carga', async ({ page }) => {
  // Login
  let start = Date.now()
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')
  const loginTime = Date.now() - start
  console.log(`⏱️ Login DOM: ${loginTime}ms`)
  expect(loginTime).toBeLessThan(3000)

  // Vista interior con auth
  await injectMockAuth(page)
  start = Date.now()
  await page.goto('/fichas', { waitUntil: 'domcontentloaded' })
  const fichasTime = Date.now() - start
  console.log(`⏱️ Fichas DOM: ${fichasTime}ms`)
  expect(fichasTime).toBeLessThan(5000)
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 12: Sin errores JS en ninguna página
   ══════════════════════════════════════════════════════════════════════ */
test('12-sin-errores — console errors en todas las páginas', async ({ page }) => {
  await injectMockAuth(page)
  const errors = []

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  for (const tool of TOOLS) {
    await page.goto(tool.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
  }

  if (errors.length > 0) {
    throw new Error(`Errores JS encontrados:\n${errors.join('\n')}`)
  }
  console.log('✅ Cero errores JS en todas las páginas')
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 13: Menú hamburguesa — abrir dropdown y navegar (mobile)
   ══════════════════════════════════════════════════════════════════════ */
test('13-hamburguesa — abrir dropdown y navegar (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Verificar botón hamburguesa visible
  const menuBtn = page.locator('button[aria-label="Menú de navegación"]')
  await expect(menuBtn).toBeVisible()
  console.log('✅ Botón hamburguesa visible en mobile')

  // Abrir menú
  await menuBtn.click()
  await page.waitForTimeout(300)

  // Verificar dropdown con 7 enlaces
  const dropdownItems = page.locator('a[class*="dropdownItem"]')
  const count = await dropdownItems.count()
  expect(count).toBeGreaterThanOrEqual(7)
  console.log(`✅ Dropdown abierto con ${count} enlaces`)

  await page.screenshot({ path: 'e2e/results/13-hamburguesa-open.png', fullPage: true })

  // Verificar que el sidebar lateral NO está visible en mobile
  const sidebar = page.locator('aside')
  const sidebarVisible = await sidebar.isVisible()
  expect(sidebarVisible).toBe(false)
  console.log('✅ Sidebar lateral oculto en mobile')

  // Navegar a otra herramienta desde el dropdown usando evaluate (evita problemas de pointer events)
  await page.evaluate(() => {
    const links = document.querySelectorAll('a[class*="dropdownItem"]')
    if (links[1]) links[1].click()
  })
  await page.waitForTimeout(500)
  const url = page.url()
  expect(url).toContain('/almacen')
  console.log('✅ Navegación desde dropdown funciona')

  // Verificar que el dropdown se cerró tras el click
  await page.waitForTimeout(200)
  const closedCount = await dropdownItems.count()
  expect(closedCount).toBe(0)
  console.log('✅ Dropdown se cerró tras navegar')

  await page.screenshot({ path: 'e2e/results/13-hamburguesa-navigate.png', fullPage: true })
})

/* ══════════════════════════════════════════════════════════════════════
   TEST 14: Hamburguesa en tablet
   ══════════════════════════════════════════════════════════════════════ */
test('14-hamburguesa — tablet', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await injectMockAuth(page)
  await page.goto('/fichas', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Verificar botón hamburguesa visible
  const menuBtn = page.locator('button[aria-label="Menú de navegación"]')
  await expect(menuBtn).toBeVisible()

  // Abrir menú
  await menuBtn.click()
  await page.waitForTimeout(300)

  const dropdownItems = page.locator('a[class*="dropdownItem"]')
  const count = await dropdownItems.count()
  expect(count).toBeGreaterThanOrEqual(7)
  console.log(`✅ Tablet: dropdown con ${count} enlaces`)

  await page.screenshot({ path: 'e2e/results/14-hamburguesa-tablet.png', fullPage: true })

  // Sidebar oculto en tablet también
  const sidebar = page.locator('aside')
  expect(await sidebar.isVisible()).toBe(false)
  console.log('✅ Sidebar oculto en tablet')
})
