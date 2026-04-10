/**
 * Scraper Sonepar — Click en familias reales
 * Click en cada caja boxAreaNegocio para cargar sus productos
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-definitivo.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const FAMILIAS_WEB = [
  'CABLES',
  'DISTRIBUCION DE POTENCIA',
  'CONTROL Y AUTOMATIZACION INDUSTRIAL',
  'AUTOMATIZACION DE EDIFICIOS',
  'ILUMINACION',
  'HVAC',
  'SEGURIDAD Y HERRAMIENTAS',
  'FONTANERIA',
  'ENERGIAS RENOVABLES',
  'SERVICIOS',
];

async function main() {
  console.log('🚀 Scraper — Click en Familias Reales\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  const page = await context.newPage();
  const todosLosProductos = [];

  // Interceptar API
  context.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          for (const art of body.dataRes) {
            const ref = art.codigoArticulo || '';
            if (!ref || todosLosProductos.find(p => p.ref === ref)) continue;

            const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
            const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann|Simon|Niessen|Exzhellent)/i);

            todosLosProductos.push({
              ref,
              desc,
              marca: marcaMatch?.[1] || art.marca || '',
              familia: art.descFam1 || '',
              subfamilia: art.descFam2 || '',
              tipo: art.descFam3 || '',
              precio: art.precioUnitario || '',
            });
          }
          console.log(`    📦 +${body.dataRes.length} artículos (total: ${todosLosProductos.length})`);
        }
      } catch {}
    }
  });

  // Inicializar
  console.log('📍 Inicializando...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
    if (btn) { await btn.click(); await sleep(1000); }
  } catch {}

  // Para cada familia, hacer clic en la caja
  for (let i = 0; i < FAMILIAS_WEB.length; i++) {
    const famName = FAMILIAS_WEB[i];
    console.log(`\n[${i + 1}/${FAMILIAS_WEB.length}] ${famName}`);

    const countBefore = todosLosProductos.length;

    try {
      // Ir a home para resetear
      await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);

      // Buscar y hacer clic en la caja de la familia
      const familyBox = await page.$(`.boxAreaNegocio:has-text("${famName}")`);
      if (familyBox) {
        await familyBox.click();
        console.log(`  ✅ Click en ${famName}`);
      } else {
        // Intentar con URL directa
        const urlMap = {
          'CABLES': 'cables',
          'DISTRIBUCION DE POTENCIA': 'distribucion-potencia',
          'CONTROL Y AUTOMATIZACION INDUSTRIAL': 'control-automatizacion-industrial',
          'AUTOMATIZACION DE EDIFICIOS': 'automatizacion-edificios',
          'ILUMINACION': 'iluminacion',
          'HVAC': 'hvac-climatizacion',
          'SEGURIDAD Y HERRAMIENTAS': 'seguridad-herramientas',
          'FONTANERIA': 'fontaneria',
          'ENERGIAS RENOVABLES': 'energias-renovables',
          'SERVICIOS': 'servicios',
        };
        const urlSlug = urlMap[famName] || famName.toLowerCase().replace(/\s+/g, '-');
        await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${urlSlug}`, {
          waitUntil: 'domcontentloaded', timeout: 15000
        });
        console.log(`  🔗 URL directa: ${urlSlug}`);
      }

      await sleep(3000);

      // Scroll para cargar productos
      for (let s = 0; s < 15; s++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await sleep(400);
      }

      await sleep(2000);

      const newCount = todosLosProductos.length - countBefore;
      console.log(`  📊 ${newCount} nuevos productos (total: ${todosLosProductos.length})`);

    } catch (err) {
      console.log(`  ⚠️ Error: ${err.message.substring(0, 60)}`);
    }

    // Guardar progreso
    fs.writeFileSync(RESULT_FILE, JSON.stringify(todosLosProductos, null, 2));
    await sleep(1000);
  }

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(70));
  console.log(`Total referencias únicas: ${todosLosProductos.length}`);

  const porFamilia = {};
  for (const p of todosLosProductos) {
    const fam = p.familia || 'Sin familia';
    porFamilia[fam] = (porFamilia[fam] || 0) + 1;
  }
  for (const [fam, count] of Object.entries(porFamilia).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${fam.padEnd(40)} ${count} refs`);
  }

  const marcasCount = {};
  for (const p of todosLosProductos) {
    if (p.marca) marcasCount[p.marca] = (marcasCount[p.marca] || 0) + 1;
  }
  const topMarcas = Object.entries(marcasCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\n🏷️ Top marcas:');
  for (const [marca, count] of topMarcas) {
    console.log(`  ${marca.padEnd(20)} ${count} refs`);
  }

  fs.writeFileSync(RESULT_FILE, JSON.stringify(todosLosProductos, null, 2));
  console.log(`\n💾 ${RESULT_FILE}`);

  await browser.close();
}

main().catch(console.error);
