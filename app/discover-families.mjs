/**
 * Descubre TODAS las familias reales con sus slugs correctos
 */
import { chromium } from 'playwright';
import fs from 'fs';

const OUTPUT_FILE = './sonepar-catalog-scraper/familias-reales.json';
fs.mkdirSync('./sonepar-catalog-scraper', { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Descubriendo familias reales de Sonepar...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Navegar a la página principal del catálogo
  console.log('📍 Navegando al catálogo...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo', { 
    waitUntil: 'networkidle', 
    timeout: 30000 
  }).catch(() => {});
  await sleep(5000);

  // Aceptar cookies
  try {
    for (const sel of ['button:has-text("ACEPTAR")', 'button:has-text("Aceptar")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); console.log('✅ Cookies aceptadas'); break; }
    }
  } catch {}
  await sleep(2000);

  // Extraer familias del sidebar
  console.log('\n📋 Extrayendo familias del sidebar...\n');
  
  const familias = await page.evaluate(() => {
    const results = [];
    // Buscar en el sidebar del catálogo - múltiples selectores posibles
    const allLinks = document.querySelectorAll('a[href*="/catalogo/familia/"], a[href*="#/catalogo/familia/"], a[href*="familia"]');
    
    allLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent.trim();
      const match = href.match(/familia\/([^#?&]+)/);
      if (match && text.length > 2) {
        results.push({
          slug: match[1],
          nombre: text,
          href: href
        });
      }
    });

    // Si no encontró con enlaces, intentar con lista de categorías
    if (results.length === 0) {
      const items = document.querySelectorAll('.category-item, .sidebar-item, .menu-item, [class*="familia"], [class*="category"]');
      items.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
          const href = link.getAttribute('href') || '';
          const text = link.textContent.trim() || item.textContent.trim();
          const match = href.match(/familia\/([^#?&]+)/);
          if (match && text.length > 2) {
            results.push({ slug: match[1], nombre: text, href });
          }
        }
      });
    }

    // Intentar con cualquier enlace que tenga "familia"
    if (results.length === 0) {
      const allAs = document.querySelectorAll('a');
      allAs.forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.includes('familia') && href.includes('catalogo')) {
          const match = href.match(/familia\/([^#?&]+)/);
          if (match) {
            results.push({
              slug: match[1],
              nombre: a.textContent.trim() || match[1],
              href
            });
          }
        }
      });
    }

    // Eliminar duplicados
    const seen = new Set();
    return results.filter(f => {
      if (seen.has(f.slug)) return false;
      seen.add(f.slug);
      return true;
    });
  });

  if (familias.length === 0) {
    console.log('⚠️  No se encontraron familias automáticamente.');
    console.log('🔍 Intentando con slugs conocidos alternativos...\n');
    
    // Probar slugs alternativos comunes
    const slugsAlternativos = [
      'cables',
      'distribucion-de-potencia',
      'distribucion-potencia',
      'control-y-automatizacion',
      'control-automatizacion',
      'automatizacion-industrial',
      'control-automatizacion-industrial',
      'automatizacion-edificios',
      'automatizacion-de-edificios',
      'iluminacion',
      'iluminacion-led',
      'climatizacion',
      'hvac',
      'hvac-climatizacion',
      'seguridad',
      'seguridad-y-herramientas',
      'herramientas',
      'fontaneria',
      'energias-renovables',
      'energias-renovables-y-eficiencia',
      'servicios',
      'servicios-logisticos',
    ];

    for (const slug of slugsAlternativos) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${slug}?page=1`;
      console.log(`  Probando: ${slug}...`);
      
      const responsePromise = new Promise(resolve => {
        let resolved = false;
        const handler = async (response) => {
          if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
            resolved = true;
            try {
              const json = await response.json();
              resolve({ slug, count: json.dataRes?.length || 0, hasData: true });
            } catch {
              resolve({ slug, count: 0, hasData: false });
            }
          }
        };
        page.on('response', handler);
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            page.off('response', handler);
            resolve({ slug, count: 0, hasData: false });
          }
        }, 8000);
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await sleep(1000);
      const result = await responsePromise;
      if (result.hasData && result.count > 0) {
        console.log(`  ✅ ${slug}: ${result.count} productos en pág 1`);
        familias.push({ slug: result.slug, nombre: result.slug.toUpperCase(), count: result.count });
      }
    }
  } else {
    console.log(`✅ ${familias.length} familias descubiertas:\n`);
    familias.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.nombre} → slug: "${f.slug}"`);
    });
  }

  // Guardar resultado
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(familias, null, 2));
  console.log(`\n💾 Guardado en ${OUTPUT_FILE} (${familias.length} familias)`);

  await browser.close();
  console.log('\n🎉 Descubrimiento completado');
}

main().catch(console.error);
