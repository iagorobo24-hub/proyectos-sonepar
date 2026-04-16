// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Fichas Tecnicas - Bug Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__PW_MOCK_USER__ = {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
      };
    });
  });

  test('Bug 1 fixed: categories show reference counts > 0', async ({ page }) => {
    await page.goto('/app/fichas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Wait for heading to appear
    await expect(page.getByRole('heading', { name: /Fichas Técnicas/i })).toBeVisible({ timeout: 10000 });

    // Check that sidebar has category buttons with ref counts
    // Use text-based locator since CSS module classes are hashed
    const catButtons = page.locator('button', { hasText: /refs$/ });
    const count = await catButtons.count();
    expect(count).toBeGreaterThan(0);

    // At least some categories should have non-zero refs
    let nonZeroCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await catButtons.nth(i).textContent();
      const match = text.match(/(\d+)\s*refs/);
      if (match && parseInt(match[1]) > 0) {
        nonZeroCount++;
      }
    }
    expect(nonZeroCount).toBeGreaterThan(0);
    
    console.log(`✓ ${count} category buttons, ${nonZeroCount} with non-zero refs`);
  });

  test('Bug 2 fixed: navigation between tools works without reload', async ({ page }) => {
    // Start at Fichas Tecnicas
    await page.goto('/app/fichas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: /Fichas Técnicas/i })).toBeVisible({ timeout: 5000 });

    // Track if page reloads (we DON'T want this)
    let reloadCount = 0;
    page.on('load', () => { reloadCount++; });

    // Click on Incidencias
    await page.getByRole('link', { name: /Incidencias/i }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/incidencias');
    await expect(page.getByRole('heading', { name: /Incidencias/i })).toBeVisible({ timeout: 5000 });

    // Click on SONEX
    await page.getByRole('link', { name: /Sonex/i }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/sonex');
    await expect(page.getByRole('heading', { name: /Sonex/i })).toBeVisible({ timeout: 5000 });

    // Click on KPI
    await page.getByRole('link', { name: /KPI/i }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/kpi');
    await expect(page.getByRole('heading', { name: /KPI/i })).toBeVisible({ timeout: 5000 });

    // Verify no full page reloads occurred (only initial load)
    expect(reloadCount).toBeLessThanOrEqual(1);
    console.log(`✓ Navigation worked without reloads (reloadCount: ${reloadCount})`);
  });

  test('category navigation works - clicking a category shows content', async ({ page }) => {
    await page.goto('/app/fichas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click on "Iluminación" which has 36 refs
    const ilumBtn = page.locator('button', { hasText: /Iluminación/ });
    await expect(ilumBtn).toBeVisible();
    await ilumBtn.click();
    await page.waitForTimeout(500);

    // Should show brands or gamas content - use body text to avoid multiple <main> issue
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Varias|gama|tipo|Elige|ILUMINACION/i);
    console.log('✓ Category navigation shows content');
  });
});
