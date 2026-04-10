/**
 * Scraper Sonepar — Familia por Familia
 * Navega cada familia para obtener sus productos via API LovArticulos
 * Progreso incremental y resumible
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-familias.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-masivo.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { familias: {}, totalRefs: 0 };
}

function guardarProgreso(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// Familias con URLs correctas basadas en estructura real
const FAMILIAS = [
  { nombre: 'Cables', url: 'cables' },
  { nombre: 'Distribucion Potencia', url: 'distribucion-potencia' },
  { nombre: 'Control Automatizacion', url: 'control-automatizacion-industrial' },
  { nombre: 'Automatizacion Edificios', url: 'automatizacion-edificios' },
  { nombre: 'Iluminacion', url: 'iluminacion' },
  { nombre: 'HVAC', url: 'hvac-climatizacion' },
  { nombre: 'Seguridad Herramientas', url: 'seguridad-herramientas' },
  { nombre: 'Fontaneria', url: 'fontaneria' },
  { nombre: 'Energias Renovables', url: 'energias-renovables' },
  { nombre: 'Servicios', url: 'servicios' },
];

let progreso = cargarProgreso();
let globalProductos = [];
if (fs.existsSync(RESULT_FILE)) {
  try { globalProductos = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
}

async function scrapeFamilia(browser, familia) {
  if (progreso.familias[familia.nombre]) {
    console.log(`  ⏭️ ${familia.nombre} — ya hecho (${progreso.familias[familia.nombre]} refs)`);
    return;
  }

  console.log(`\n  📂 ${familia.nombre}`);
  const page = await browser.newPage();
  const familiaProductos = [];

  try {
    await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.url}`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await sleep(3000);

    // Scroll para cargar productos iniciales
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 2000));
      await sleep(500);
    }

    // Esperar API
    await sleep(2000);

    // Buscar enlaces de subfamilias y hacer clic
    const subLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="subfamilia"], [class*="subfamilia"] a, [class*="familia"] a').forEach(a => {
        const text = a.textContent?.trim();
        if (text && text.length > 3 && text.length < 80) {
          links.push({ text, href: a.href || '' });
        }
      });
      const seen = new Set();
      return links.filter(l => {
        if (seen.has(l.text)) return false;
        seen.add(l.text);
        return true;
      }).slice(0, 15);
    });

    console.log(`    🔗 ${subLinks.length} subfamilias encontradas`);

    // Para cada subfamilia, hacer clic y capturar productos
    for (let i = 0; i < Math.min(subLinks.length, 5); i++) {
      const sub = subLinks[i];
      console.log(`    → ${sub.text.substring(0, 40)}...`);

      const countBefore = globalProductos.length;
      
      // Navegar a subfamilia
      if (sub.href) {
        await page.goto(sub.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } else {
        await page.click(`a:has-text("${sub.text.substring(0, 30)}")`);
      }
      await sleep(2000);

      // Scroll
      for (let s = 0; s < 8; s++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await sleep(400);
      }
      await sleep(1000);

      const newProducts = globalProductos.slice(countBefore);
      console.log(`      ✅ ${newProducts.length} nuevos productos`);
      familiaProductos.push(...newProducts);
    }

  } catch (err) {
    console.log(`    ⚠️ Error: ${err.message.substring(0, 60)}`);
  } finally {
    await page.close();
  }

  progreso.familias[familia.nombre] = familiaProductos.length;
  progreso.totalRefs = Object.values(progreso.familias).reduce((a, b) => a + b, 0);
  guardarProgreso(progreso);
}

async function main() {
  console.log('🚀 Scraper Familia por Familia\n');
  console.log(`Progreso: ${progreso.totalRefs} refs en ${Object.keys(progreso.familias).length} familias\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  // Interceptar API
  context.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          for (const art of body.dataRes) {
            const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
            const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann|Simon|Niessen)/i);
            
            const ref = art.codigoArticulo || '';
            if (!ref || globalProductos.find(p => p.ref === ref)) continue;

            globalProductos.push({
              ref,
              desc,
              marca: marcaMatch?.[1] || '',
              familia: art.descFam1 || '',
              subfamilia: art.descFam2 || '',
              tipo: art.descFam3 || '',
              precio: art.precioUnitario || '',
            });
          }
        }
      } catch {}
    }
  });

  // Cookies
  const initPage = await context.newPage();
  try {
    await initPage.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(2000);
    try {
      const btn = await initPage.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
      if (btn) { await btn.click(); await sleep(1000); }
    } catch {}
  } catch {}
  await initPage.close();

  // Scrapar cada familia
  for (const fam of FAMILIAS) {
    await scrapeFamilia(browser, fam);
    await sleep(2000);
  }

  // Guardar resultados
  fs.writeFileSync(RESULT_FILE, JSON.stringify(globalProductos, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN');
  console.log('='.repeat(70));
  console.log(`Total referencias únicas: ${globalProductos.length}`);

  const porFamilia = {};
  for (const p of globalProductos) {
    const fam = p.familia || 'Sin familia';
    porFamilia[fam] = (porFamilia[fam] || 0) + 1;
  }
  for (const [fam, count] of Object.entries(porFamilia)) {
    console.log(`  ${fam.padEnd(35)} ${count} refs`);
  }

  await browser.close();
}

main().catch(console.error);
