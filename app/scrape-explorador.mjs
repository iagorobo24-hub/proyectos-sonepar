/**
 * Scraper Sonepar — Explorador + Extractor
 * Paso 1: Explora la tienda para encontrar URLs reales de categorías
 * Paso 2: Extrae productos de cada categoría encontrada
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Explorador Catálogo Sonepar\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Capturar todas las requests XHR para encontrar APIs de productos
  const apiCalls = [];
  page.on('response', async response => {
    const url = response.url();
    if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
      if (url.includes('api') || url.includes('product') || url.includes('catalog') || url.includes('search') || url.includes('familia') || url.includes('subfamilia')) {
        try {
          const body = await response.json();
          apiCalls.push({ url: url.substring(0, 200), status: response.status(), size: JSON.stringify(body).length });
          console.log(`  📡 [${response.status()}] ${url.substring(0, 100)} (${JSON.stringify(body).length} bytes)`);
        } catch {}
      }
    }
  });

  // Intentar diferentes patrones de URL
  const urlPatterns = [
    'https://tienda.sonepar.es/tienda/',
    'https://tienda.sonepar.es/',
  ];

  for (const baseUrl of urlPatterns) {
    console.log(`\n📍 Probando: ${baseUrl}`);
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);

      // Screenshot para ver qué hay
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'tienda-home.png'), fullPage: false });
      console.log('  📸 Screenshot guardado');

      // Buscar enlaces de categorías en la página
      const categorias = await page.evaluate(() => {
        const links = [];
        // Buscar todos los enlaces que parezcan categorías
        const allLinks = document.querySelectorAll('a[href]');
        for (const a of allLinks) {
          const href = a.href;
          const text = a.textContent?.trim() || '';
          // Filtrar enlaces de categorías
          if (text.length > 3 && text.length < 50 && (href.includes('catalogo') || href.includes('familia') || href.includes('categoria'))) {
            links.push({ text, href: href.substring(0, 150) });
          }
        }
        // También buscar en el contenido de la página
        const bodyText = document.body.innerText;
        const catKeywords = ['Variador', 'Contactor', 'PLC', 'Sensor', 'Cable', 'Iluminación', 'Solar', 'Herramienta'];
        for (const kw of catKeywords) {
          if (bodyText.includes(kw)) {
            links.push({ text: `Contenido: ${kw}`, href: 'en-contenido' });
          }
        }
        // Eliminar duplicados
        const seen = new Set();
        return links.filter(l => {
          if (seen.has(l.text)) return false;
          seen.add(l.text);
          return true;
        }).slice(0, 30);
      });

      console.log(`  🔗 ${categorias.length} enlaces encontrados:`);
      for (const c of categorias.slice(0, 15)) {
        console.log(`    - ${c.text}: ${c.href}`);
      }

      // Buscar formulario de búsqueda
      const searchExists = await page.evaluate(() => {
        return document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]') !== null;
      });
      console.log(`  🔍 Búsqueda disponible: ${searchExists}`);

      if (categorias.length > 0) {
        // Guardar enlaces encontrados
        fs.writeFileSync(path.join(OUTPUT_DIR, 'enlaces-categorias.json'), JSON.stringify(categorias, null, 2));
        break;
      }
    } catch (err) {
      console.log(`  ⚠️ Error: ${err.message.substring(0, 60)}`);
    }
  }

  // Mostrar APIs encontradas
  console.log('\n' + '='.repeat(60));
  console.log('📡 APIs ENCONTRADAS');
  console.log('='.repeat(60));
  if (apiCalls.length > 0) {
    for (const api of apiCalls.slice(0, 20)) {
      console.log(`  ${api.url}`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'apis-encontradas.json'), JSON.stringify(apiCalls, null, 2));
  } else {
    console.log('  No se detectaron APIs de productos');
  }

  // Guardar HTML de la página para análisis
  const html = await page.content();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tienda-home.html'), html);
  console.log('\n💾 HTML guardado: tienda-home.html');

  console.log('\n' + '='.repeat(60));
  console.log('Para continuar, revisa los archivos generados:');
  console.log(`  - ${OUTPUT_DIR}/enlaces-categorias.json`);
  console.log(`  - ${OUTPUT_DIR}/apis-encontradas.json`);
  console.log(`  - ${OUTPUT_DIR}/tienda-home.png`);
  console.log('='.repeat(60));

  await browser.close();
}

main().catch(console.error);
