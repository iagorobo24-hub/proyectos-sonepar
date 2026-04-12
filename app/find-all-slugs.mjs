import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Probando TODAS las variantes de slug posibles...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Login
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  try {
    for (const sel of ['button:has-text("ACEPTAR")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); break; }
    }
  } catch {}
  await sleep(1000);

  // ALL possible slug variations for remaining families
  const testSlugs = [
    // HVAC
    'climatizacion', 'hvac', 'clima', 'aire-acondicionado', 'ventilacion', 'calefaccion', 'hvac-clima', 'termotecnia',
    // Seguridad y Herramientas  
    'seguridad', 'herramientas', 'seguridad-herramientas', 'seguridad-y-herramientas', 'seguridad-industrial',
    'epi', 'equipos-proteccion', 'herramientas-profesionales', 'seg-y-herr', 'seguridad-herr',
    // Fontanería
    'fontaneria', 'saneamiento', 'fontaneria-saneamiento', 'fontaneria-y-saneamiento', 'agua', 'hidraulica',
    // Energías Renovables
    'energias-renovables', 'energia-solar', 'renovables', 'solar', 'fotovoltaica', 'autoconsumo', 'carga-ve', 'movilidad-electrica',
    // Servicios
    'servicios', 'servicios-logisticos', 'logistica', 'transporte', 'almacenaje', 'consultoria',
  ];

  const found = [];

  for (const slug of testSlugs) {
    process.stdout.write(`  ${slug.padEnd(40)} `);
    
    // Navigate
    await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${slug}?page=1`, {
      waitUntil: 'domcontentloaded', timeout: 10000
    }).catch(() => {});
    await sleep(2000);

    const result = await new Promise(resolve => {
      let resolved = false;
      const handler = async (response) => {
        if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
          try {
            const json = await response.json();
            resolved = true;
            resolve({ count: json.dataRes?.length || 0, numReg: json.numReg || 0 });
          } catch { resolved = true; resolve({ count: 0, numReg: 0 }); }
        }
      };
      page.on('response', handler);
      page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      setTimeout(() => {
        if (!resolved) { resolved = true; page.off('response', handler); resolve({ count: 0, numReg: 0 }); }
      }, 8000);
    });

    if (result.numReg > 0) {
      console.log(`✅ ${result.count} (total: ${result.numReg})`);
      found.push({ slug, count: result.count, total: result.numReg });
    } else {
      console.log('❌');
    }
    await sleep(500);
  }

  await browser.close();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ ${found.length} familias encontradas:`);
  found.forEach(f => console.log(`  ✅ "${f.slug}" → ${f.total} productos`));

  // Save and merge with existing
  const existing = fs.existsSync('./sonepar-catalog-scraper/familias-web.json')
    ? JSON.parse(fs.readFileSync('./sonepar-catalog-scraper/familias-web.json', 'utf8')) : [];
  
  const all = [...existing];
  for (const f of found) {
    if (!all.find(e => e.slug === f.slug)) {
      all.push({ nombre: f.slug.toUpperCase().replace(/-/g, ' '), slug: f.slug, numReg: f.total });
    }
  }

  fs.writeFileSync('./sonepar-catalog-scraper/familias-web.json', JSON.stringify(all, null, 2));
  console.log(`\n💾 Guardado: familias-web.json (${all.length} familias)`);
}

main().catch(console.error);
