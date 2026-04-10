/**
 * Scraper Sonepar — Captura de API de productos
 * Intercepta TODAS las requests de red para encontrar el endpoint de productos
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Interceptor de API Sonepar\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const allRequests = [];

  // Interceptar TODAS las responses
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    const type = response.request().resourceType();
    
    // Filtrar solo XHR/fetch con tamaño significativo
    if ((type === 'xhr' || type === 'fetch') && status === 200) {
      try {
        const body = await response.json();
        const size = JSON.stringify(body).length;
        
        // Guardar solo respuestas grandes (posiblemente productos)
        if (size > 1000) {
          allRequests.push({
            url: url.substring(0, 250),
            status,
            size,
            type: body.constructor === Array ? 'array' : typeof body,
            keys: typeof body === 'object' ? Object.keys(body).slice(0, 10) : [],
            preview: JSON.stringify(body).substring(0, 300),
          });
          console.log(`  📡 [${status}] ${url.substring(0, 80)}... (${size} bytes, ${type})`);
        }
      } catch {}
    }
  });

  // Paso 1: Ir a la tienda y aceptar cookies
  console.log('📍 Paso 1: Inicializando sesión...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
    if (btn) { await btn.click(); await sleep(1000); }
  } catch {}

  // Paso 2: Ir a una familia específica (Cables)
  console.log('\n📍 Paso 2: Navegando a Cables...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo/familia/cables', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // Paso 3: Hacer scroll para cargar contenido
  console.log('\n📍 Paso 3: Scrolling...');
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await sleep(800);
  }

  // Paso 4: Buscar y hacer clic en una subfamilia
  console.log('\n📍 Paso 4: Buscando subfamilias...');
  
  // Intentar encontrar enlaces de subfamilias
  const subfamilias = await page.evaluate(() => {
    const links = [];
    const allLinks = document.querySelectorAll('a[href]');
    for (const a of allLinks) {
      const href = a.href;
      const text = a.textContent?.trim() || '';
      if (text.length > 3 && text.length < 60 && (href.includes('subfamilia') || href.includes('familia'))) {
        links.push({ text, href: href.substring(0, 150) });
      }
    }
    const seen = new Set();
    return links.filter(l => {
      if (seen.has(l.text)) return false;
      seen.add(l.text);
      return true;
    }).slice(0, 10);
  });

  console.log(`  🔗 ${subfamilias.length} subfamilias encontradas:`);
  for (const s of subfamilias) {
    console.log(`    - ${s.text}`);
  }

  // Guardar todas las requests capturadas
  fs.writeFileSync(path.join(OUTPUT_DIR, 'todas-las-requests.json'), JSON.stringify(allRequests, null, 2));
  console.log('\n💾 Todas las requests guardadas');

  // Analizar respuestas para encontrar productos
  console.log('\n' + '='.repeat(70));
  console.log('ANÁLISIS DE RESPUESTAS');
  console.log('='.repeat(70));

  for (const req of allRequests) {
    if (req.size > 5000) {
      console.log(`\n📦 ${req.url.substring(0, 100)}`);
      console.log(`   Tamaño: ${req.size} bytes | Tipo: ${req.type}`);
      console.log(`   Preview: ${req.preview.substring(0, 200)}...`);
    }
  }

  // Screenshot del estado actual
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'estado-cables.png'), fullPage: false });
  console.log('\n📸 Screenshot guardado');

  await browser.close();

  console.log('\n' + '='.repeat(70));
  console.log('Para continuar, revisa:');
  console.log(`  - ${OUTPUT_DIR}/todas-las-requests.json`);
  console.log(`  - ${OUTPUT_DIR}/estado-cables.png`);
  console.log('='.repeat(70));
}

main().catch(console.error);
