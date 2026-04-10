/**
 * Scraper Total Sonepar V2 — Navegación Directa por URLs
 * 1. Navegar a URL de Familia -> 2. Captura API -> 3. Clic "Siguiente" -> Repetir
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-total.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-final-sonepar.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Configuración
const CONFIG = {
  maxProductsPerCategory: 500, // Aumentado a 500 para prueba profunda
  delayBetweenClicks: 800,
};

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { currentCategoryIndex: 0, totalProducts: 0 };
}

function guardarProgreso(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// Mapa de Familias -> Slugs de URL
const FAMILIAS_MAP = [
  { nombre: 'CABLES', slug: 'cables' },
  { nombre: 'DISTRIBUCION DE POTENCIA', slug: 'distribucion-potencia' },
  { nombre: 'CONTROL Y AUTOMATIZACION INDUSTRIAL', slug: 'control-automatizacion-industrial' },
  { nombre: 'AUTOMATIZACION DE EDIFICIOS', slug: 'automatizacion-edificios' },
  { nombre: 'ILUMINACION', slug: 'iluminacion' },
  { nombre: 'HVAC', slug: 'hvac-climatizacion' },
  { nombre: 'SEGURIDAD Y HERRAMIENTAS', slug: 'seguridad-herramientas' },
  { nombre: 'FONTANERIA', slug: 'fontaneria' },
  { nombre: 'ENERGIAS RENOVABLES', slug: 'energias-renovables' },
  { nombre: 'SERVICIOS', slug: 'servicios' },
];

async function main() {
  console.log('🚀 Scraper Total Estructurado V2\n');

  let progreso = cargarProgreso();
  let productosGlobales = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { productosGlobales = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso: Familia ${progreso.currentCategoryIndex + 1}/${FAMILIAS_MAP.length} | ${productosGlobales.length} productos\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // 1. Interceptar API
  let bufferPaginaActual = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          bufferPaginaActual = body.dataRes;
        }
      } catch {}
    }
  });

  // 2. Inicio y Cookies
  console.log('📍 Inicializando...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR")');
    if (btn) await btn.click();
  } catch {}
  await sleep(1000);

  // 3. Bucle por Familias (Navegación Directa)
  for (let i = progreso.currentCategoryIndex; i < FAMILIAS_MAP.length; i++) {
    const familia = FAMILIAS_MAP[i];
    const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.slug}`;
    
    console.log(`\n📂 [${i + 1}/${FAMILIAS_MAP.length}] ${familia.nombre}`);
    console.log(`   🔗 ${url}`);

    // Resetear buffer
    bufferPaginaActual = [];
    let productosFamilia = 0;
    let paginaActual = 1;

    // Navegar directamente a la familia
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log(`  ✅ Navegado a ${familia.nombre}`);
    } catch (err) {
      console.log(`  ❌ Error navegando: ${err.message}`);
      continue;
    }

    await sleep(CONFIG.delayBetweenClicks);

    // 4. Bucle de Paginación
    while (true) {
      // Esperar datos
      let intentos = 0;
      while (bufferPaginaActual.length === 0 && intentos < 10) {
        await sleep(500);
        intentos++;
      }

      if (bufferPaginaActual.length === 0) {
        console.log(`  ⏹️ Timeout esperando datos en página ${paginaActual}`);
        break;
      }

      // Procesar productos
      for (const art of bufferPaginaActual) {
        const ref = art.codigoArticulo || '';
        if (!ref || productosGlobales.find(p => p.ref === ref)) continue;

        const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
        const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann|Simon|Niessen|Exzhellent)/i);

        productosGlobales.push({
          ref,
          desc,
          marca: marcaMatch?.[1] || '',
          familia: familia.nombre,
          subfamilia: art.descFam2 || '',
          tipo: art.descFam3 || '',
          precio: art.precioUnitario || '',
        });
      }
      
      productosFamilia += bufferPaginaActual.length;
      console.log(`    📄 Pág ${paginaActual}: +${bufferPaginaActual.length} (Total familia: ${productosFamilia})`);
      
      bufferPaginaActual = [];
      paginaActual++;

      // Límite de seguridad
      if (productosFamilia >= CONFIG.maxProductsPerCategory) {
        console.log(`    ⚠️ Límite de seguridad alcanzado (${CONFIG.maxProductsPerCategory})`);
        break;
      }

      // Buscar botón "Siguiente"
      try {
        // 1. Scroll al final de la página para asegurar que el paginador es visible
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(500);

        // Selectores más robustos para Vuetify/Angular
        const selectors = [
          '.v-pagination__next',
          'button:has(i:has-text("chevron_right"))',
          'a:has-text("Siguiente")',
          'i.material-icons:has-text("chevron_right")'
        ];
        
        let nextBtn = null;
        for (const sel of selectors) {
          nextBtn = await page.$(sel);
          if (nextBtn) break;
        }
        
        // Si encontramos el icono, subir al botón padre
        if (nextBtn && await nextBtn.evaluate(n => n.tagName === 'I')) {
          nextBtn = await nextBtn.$('xpath=ancestor::button[1]');
        }

        // Verificar si está deshabilitado
        const isDisabled = await page.evaluate(btn => {
           if (!btn) return true;
           return btn.disabled || 
                  btn.getAttribute('aria-disabled') === 'true' ||
                  btn.classList.contains('disabled') ||
                  btn.parentElement.classList.contains('disabled');
        }, nextBtn);

        if (nextBtn && !isDisabled) {
          await nextBtn.scrollIntoViewIfNeeded();
          await sleep(200);
          await nextBtn.click();
          await sleep(800); 
        } else {
          console.log(`    🏁 Fin de categoría (no hay botón siguiente válido)`);
          break;
        }
      } catch (e) {
        console.log(`    🏁 Fin de categoría (error buscando botón)`);
        break;
      }
    }

    // Actualizar progreso y guardar
    progreso.currentCategoryIndex = i + 1;
    progreso.totalProducts = productosGlobales.length;
    guardarProgreso(progreso);
    fs.writeFileSync(RESULT_FILE, JSON.stringify(productosGlobales, null, 2));
  }

  console.log('\n' + '='.repeat(70));
  console.log('FINALIZADO');
  console.log('='.repeat(70));
  console.log(`Total productos: ${productosGlobales.length}`);
  
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ currentCategoryIndex: 0, totalProducts: 0 }));

  await browser.close();
}

main().catch(console.error);
