/**
 * Scraper Web Sonepar — Navegación real familia por familia
 * Extrae productos del DOM renderizado de la tienda
 * Guarda progreso continuamente
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-web.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-web-extraido.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Familias según estructura real de la web Sonepar
const FAMILIAS = [
  { nombre: 'Cables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/cables', count: 4575 },
  { nombre: 'Distribucion de Potencia', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/distribucion-potencia', count: 118417 },
  { nombre: 'Control y Automatizacion', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial', count: 79469 },
  { nombre: 'Automatizacion de Edificios', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/automatizacion-edificios', count: 47121 },
  { nombre: 'Iluminacion', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/iluminacion', count: 65631 },
  { nombre: 'HVAC Climatizacion', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/hvac-climatizacion', count: 42363 },
  { nombre: 'Seguridad y Herramientas', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/seguridad-herramientas', count: 45963 },
  { nombre: 'Fontaneria', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/fontaneria', count: 29051 },
  { nombre: 'Energias Renovables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/energias-renovables', count: 4242 },
  { nombre: 'Servicios', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/servicios', count: 56 },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { familias: {}, total: 0 };
}

function guardarProgreso(progreso) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progreso, null, 2));
}

function guardarResultados(resultados) {
  fs.writeFileSync(RESULT_FILE, JSON.stringify(resultados, null, 2));
}

async function scrapeFamilia(browser, familia, progreso, resultados) {
  const key = familia.nombre;
  if (progreso.familias[key]) {
    console.log(`  ⏭️ ${familia.nombre} — ya escrapeado (${progreso.familias[key].count} productos)\n`);
    return;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📂 ${familia.nombre} — ${familia.url}`);
  console.log(`   Artículos esperados: ${familia.count.toLocaleString()}`);
  console.log('═'.repeat(60));

  const page = await browser.newPage();
  let totalExtraidos = 0;

  try {
    await page.goto(familia.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(3000);

    // Screenshot inicial para debug
    await page.screenshot({ path: path.join(OUTPUT_DIR, `familia-${key.replace(/\s+/g, '-').toLowerCase()}.png`), fullPage: false });

    // Hacer scroll progresivo para cargar todos los productos
    const maxScrolls = 50;
    let prevCount = 0;
    let sinCambios = 0;

    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => window.scrollBy(0, 2000));
      await sleep(800);

      // Contar productos cargados
      const currentCount = await page.evaluate(() => {
        // Múltiples selectores para tarjetas de producto
        const selectors = [
          '[class*="product"]', '[class*="article"]', '[class*="item"]',
          '.card', '.tile', '.grid-item', '[class*="product-card"]',
          '[class*="product-tile"]', '[class*="articulo"]', '[class*="producto"]'
        ];
        let count = 0;
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          count = Math.max(count, els.length);
        }
        return count;
      });

      if (i % 10 === 0) {
        console.log(`  📜 Scroll ${i}/${maxScrolls} — ${currentCount} elementos cargados`);
      }

      if (currentCount === prevCount) {
        sinCambios++;
        if (sinCambios > 5) {
          console.log(`  ⏹️ Sin cambios tras ${sinCambios} scrolls, deteniendo`);
          break;
        }
      } else {
        sinCambios = 0;
      }
      prevCount = currentCount;
    }

    // Extraer productos
    console.log(`  🔍 Extrayendo productos...`);
    const products = await page.evaluate(() => {
      const items = [];
      const seenRefs = new Set();

      // Obtener TODO el texto visible de la página
      const allElements = document.querySelectorAll('div, span, p, a, li, h1, h2, h3, h4, h5, h6, td, th');
      
      // Primero buscar en elementos que parezcan tarjetas de producto
      const productContainers = document.querySelectorAll('[class*="product"], [class*="article"], [class*="item"], .card, .tile');
      
      for (const container of productContainers) {
        const text = container.textContent?.trim();
        if (!text || text.length < 10) continue;

        const refMatch = text.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{2,})\b/);
        const priceMatch = text.match(/(\d+[,.]?\d{0,2})\s*€/);
        const brandMatch = text.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs)/i);

        if (refMatch && !seenRefs.has(refMatch[1])) {
          seenRefs.add(refMatch[1]);
          items.push({
            ref: refMatch[1],
            desc: text.replace(/\s+/g, ' ').trim(),
            marca: brandMatch?.[1] || '',
            precio: priceMatch?.[0] || '',
          });
        }
      }

      // Fallback: buscar en todo el texto de la página
      if (items.length < 10) {
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').filter(l => l.trim().length > 10 && l.trim().length < 300);
        
        for (const line of lines) {
          const refMatch = line.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{2,})\b/);
          const priceMatch = line.match(/(\d+[,.]?\d{0,2})\s*€/);
          const brandMatch = line.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs)/i);

          if (refMatch && !seenRefs.has(refMatch[1]) && (priceMatch || brandMatch)) {
            seenRefs.add(refMatch[1]);
            items.push({
              ref: refMatch[1],
              desc: line.trim(),
              marca: brandMatch?.[1] || '',
              precio: priceMatch?.[0] || '',
            });
          }
        }
      }

      return items;
    });

    totalExtraidos = products.length;
    console.log(`  ✅ ${totalExtraidos} productos extraídos`);

    // Añadir a resultados
    for (const p of products) {
      resultados.push({
        ref: p.ref,
        desc: p.desc,
        marca: p.marca || 'Varias',
        familia: familia.nombre,
        precio: p.precio,
        url: familia.url,
      });
    }

    // Guardar progreso
    progreso.familias[key] = { count: totalExtraidos, date: new Date().toISOString() };
    progreso.total = Object.values(progreso.familias).reduce((a, b) => a + b.count, 0);
    guardarProgreso(progreso);
    guardarResultados(resultados);

  } catch (error) {
    console.log(`  ⚠️ Error: ${error.message.substring(0, 80)}`);
    progreso.familias[key] = { count: 0, error: error.message.substring(0, 100), date: new Date().toISOString() };
    guardarProgreso(progreso);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Scraper Web Sonepar — Familia por Familia\n');

  let progreso = cargarProgreso();
  let resultados = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { resultados = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso previo: ${progreso.total} productos en ${Object.keys(progreso.familias).length} familias\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  // Página inicial para aceptar cookies
  console.log('📍 Aceptando cookies...');
  const initPage = await context.newPage();
  try {
    await initPage.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(2000);
    try {
      const btn = await initPage.$('button:has-text("ACEPTAR"), button:has-text("Aceptar"), [class*="accept"]');
      if (btn) { await btn.click(); await sleep(1000); }
    } catch {}
  } catch {}
  await initPage.close();

  // Scrapar cada familia
  for (const familia of FAMILIAS) {
    await scrapeFamilia(browser, familia, progreso, resultados);
    await sleep(2000); // Pausa entre familias
  }

  // Resumen final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));
  
  for (const [nombre, data] of Object.entries(progreso.familias)) {
    const status = data.error ? '❌' : '✅';
    console.log(`${status} ${nombre.padEnd(30)} ${data.count?.toLocaleString() || 0} productos`);
  }

  const totalProductos = resultados.length;
  const refsUnicas = [...new Set(resultados.map(r => r.ref))];
  console.log('-'.repeat(70));
  console.log(`Total productos extraídos: ${totalProductos}`);
  console.log(`Referencias únicas: ${refsUnicas.length}`);
  console.log(`Archivo: ${RESULT_FILE}`);

  // Generar formato para app
  const formatoApp = resultados.map(p => ({
    ref: p.ref,
    desc: p.desc,
    marca: p.marca,
    familia: p.familia,
    gama: '',
    tipo: p.familia,
    precio: p.precio,
    pdf_url: '',
    imagen: '',
    keywords: [p.familia.toLowerCase(), p.marca?.toLowerCase() || ''].filter(Boolean),
  }));

  const appFile = path.join(OUTPUT_DIR, 'catalogo-para-app.json');
  fs.writeFileSync(appFile, JSON.stringify(formatoApp, null, 2));
  console.log(`\n✅ Formato app: ${appFile}`);

  await browser.close();
}

main().catch(e => { console.error('Error fatal:', e.message); process.exit(1); });
