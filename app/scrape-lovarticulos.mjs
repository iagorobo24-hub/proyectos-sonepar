/**
 * Scraper Sonepar — Captura directa de LovArticulos API
 * Extrae TODOS los productos reales de la tienda
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🚀 Scraper API LovArticulos — Productos Reales Sonepar\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const productosAPI = [];
  const preciosAPI = [];

  // Interceptar respuestas de la API de artículos
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          productosAPI.push(...body.dataRes);
          console.log(`  📦 ${body.dataRes.length} artículos capturados de ${url.substring(0, 80)}...`);
        }
      } catch {}
    }
    if (url.includes('getPrecioArticulo') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes) preciosAPI.push(body.dataRes);
      } catch {}
    }
  });

  // Inicializar sesión
  console.log('📍 Inicializando sesión...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
    if (btn) { await btn.click(); await sleep(1000); }
  } catch {}

  // Cargar catálogo para obtener estructura
  console.log('\n📍 Cargando estructura del catálogo...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo/familia/cables', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // Esperar a que se carguen los datos del catálogo
  let catalogoData = null;
  for (let i = 0; i < 10; i++) {
    const maybeCatalog = await page.evaluate(() => {
      // Buscar en el window si hay datos del catálogo
      return null;
    });
    await sleep(500);
  }

  // Scroll para disparar carga de productos
  console.log('\n📍 Scrolling para cargar productos...');
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await sleep(500);
  }

  // Buscar enlaces a subfamilias en el DOM
  console.log('\n📍 Buscando subfamilias...');
  const subfamilias = await page.evaluate(() => {
    const links = [];
    // Buscar en todos los elementos de texto
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 3 && text.length < 80) {
        // Buscar texto que parezca nombre de subfamilia
        if (/[Cc]able|[Pp]VC|[Rr]V|[Hh]alógeno|[Ff]ibra|[Cc]obre|[Ee]nergía/i.test(text)) {
          const parent = node.parentElement;
          if (parent) {
            const link = parent.closest('a') || parent.querySelector('a');
            if (link) {
              links.push({ text, href: link.href?.substring(0, 150) || '' });
            }
          }
        }
      }
    }
    // También buscar en atributos de enlaces
    document.querySelectorAll('a[href*="subfamilia"], a[href*="familia"]').forEach(a => {
      const text = a.textContent?.trim();
      if (text && text.length > 3 && text.length < 80) {
        links.push({ text, href: a.href?.substring(0, 150) || '' });
      }
    });
    // Eliminar duplicados
    const seen = new Set();
    return links.filter(l => {
      const key = l.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  });

  console.log(`  🔗 ${subfamilias.length} subfamilias encontradas:`);
  for (const s of subfamilias.slice(0, 10)) {
    console.log(`    - ${s.text} → ${s.href}`);
  }

  // Guardar datos capturados
  fs.writeFileSync(path.join(OUTPUT_DIR, 'productos-api.json'), JSON.stringify(productosAPI, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'subfamilias-encontradas.json'), JSON.stringify(subfamilias, null, 2));
  
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN');
  console.log('='.repeat(70));
  console.log(`Artículos capturados: ${productosAPI.length}`);
  console.log(`Precios capturados: ${preciosAPI.length}`);
  console.log(`Subfamilias encontradas: ${subfamilias.length}`);
  
  if (productosAPI.length > 0) {
    console.log('\nPrimeros 5 artículos:');
    for (const p of productosAPI.slice(0, 5)) {
      console.log(`  - ${p.codigoArticulo || p.codigo || 'N/A'}: ${p.descripcion?.substring(0, 80) || ''}`);
    }
  }

  console.log('\n💾 Archivos guardados:');
  console.log(`  - productos-api.json (${productosAPI.length} artículos)`);
  console.log(`  - subfamilias-encontradas.json`);

  await browser.close();
}

main().catch(console.error);
