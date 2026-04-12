/**
 * Prueba slugs de familias restantes
 */
import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const SLUGS_RESTANTES = [
  // HVAC / Climatización
  'hvac', 'hvac-climatizacion', 'climatizacion', 'climatizacion-hvac', 'aire-acondicionado',
  // Seguridad y Herramientas
  'seguridad', 'seguridad-y-herramientas', 'herramientas', 'seguridad-industrial', 'equipos-proteccion',
  // Fontanería
  'fontaneria', 'fontaneria-y-gas', 'tuberias', 'saneamiento',
  // Energías Renovables
  'energias-renovables', 'energia-solar', 'renovables', 'energia',
  // Servicios
  'servicios', 'servicios-logisticos', 'logistica',
];

async function main() {
  console.log('🔍 Probando slugs restantes...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Aceptar cookies primero
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  try {
    for (const sel of ['button:has-text("ACEPTAR")', 'button:has-text("Aceptar")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); break; }
    }
  } catch {}
  await sleep(1000);

  const found = [];

  for (const slug of SLUGS_RESTANTES) {
    const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${slug}?page=1`;
    
    const result = await new Promise(resolve => {
      let resolved = false;
      const handler = async (response) => {
        if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
          try {
            const json = await response.json();
            const count = json.dataRes?.length || 0;
            resolved = true;
            resolve({ slug, count, hasData: count > 0 });
          } catch {
            resolved = true;
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
      }, 10000);
    });

    if (result.hasData) {
      console.log(`✅ ${slug}: ${result.count} productos`);
      found.push({ slug, nombre: slug.toUpperCase().replace(/-/g, ' '), count: result.count });
    } else {
      console.log(`❌ ${slug}: vacío`);
    }
    
    await sleep(500);
  }

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ ${found.length} familias encontradas:`);
  found.forEach(f => console.log(`  └─ ${f.nombre} (${f.slug}): ${f.count} productos`));

  // Guardar
  const existing = fs.existsSync('./sonepar-catalog-scraper/familias-restantes.json')
    ? JSON.parse(fs.readFileSync('./sonepar-catalog-scraper/familias-restantes.json', 'utf8')) : [];
  const all = [...existing, ...found];
  fs.writeFileSync('./sonepar-catalog-scraper/familias-restantes.json', JSON.stringify(all, null, 2));
  console.log(`\n💾 Guardado: familias-restantes.json`);
}

main().catch(console.error);
