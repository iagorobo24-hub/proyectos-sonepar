/**
 * Scraper Total Sonepar V3 — Paginación por URL (?page=X)
 * Más robusto que buscar botones: navega página a página por URL directa.
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
  maxProductsPerCategory: 10000, // Límite por familia para evitar bucles infinitos
  delayBetweenPages: 500,        // Pausa entre páginas
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
  console.log('🚀 Scraper Total V3 — Paginación por URL\n');

  let progreso = cargarProgreso();
  let productosGlobales = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { productosGlobales = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso: Familia ${progreso.currentCategoryIndex + 1}/${FAMILIAS_MAP.length} | ${productosGlobales.length} productos\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Buffer para capturar datos de la API
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

  // Inicio y Cookies
  console.log('📍 Inicializando...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR")');
    if (btn) await btn.click();
  } catch {}
  await sleep(1000);

  // Bucle por Familias
  for (let i = progreso.currentCategoryIndex; i < FAMILIAS_MAP.length; i++) {
    const familia = FAMILIAS_MAP[i];
    const baseURL = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.slug}`;
    
    console.log(`\n📂 [${i + 1}/${FAMILIAS_MAP.length}] ${familia.nombre}`);

    bufferPaginaActual = [];
    let productosFamilia = 0;
    let pageNum = 1;

    // Bucle de Paginación por URL
    while (true) {
      const targetURL = `${baseURL}?page=${pageNum}`;
      console.log(`    🔍 Cargando página ${pageNum}...`);

      try {
        await page.goto(targetURL, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (err) {
        console.log(`    ⚠️ Error navegando a pág ${pageNum}: ${err.message}`);
        break;
      }

      // Esperar a que llegue la respuesta de la API
      let intentos = 0;
      while (bufferPaginaActual.length === 0 && intentos < 15) {
        await sleep(300);
        intentos++;
      }

      if (bufferPaginaActual.length === 0) {
        console.log(`    🏁 Fin de categoría (sin datos en pág ${pageNum})`);
        break;
      }

      // Procesar productos
      let nuevos = 0;
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
        nuevos++;
      }
      
      productosFamilia += nuevos;
      console.log(`    📄 Pág ${pageNum}: +${nuevos} (Total familia: ${productosFamilia})`);
      
      bufferPaginaActual = []; // Limpiar para siguiente iteración
      pageNum++;

      // Límite de seguridad
      if (productosFamilia >= CONFIG.maxProductsPerCategory) {
        console.log(`    ⚠️ Límite alcanzado (${CONFIG.maxProductsPerCategory})`);
        break;
      }

      // Pausa entre páginas
      await sleep(CONFIG.delayBetweenPages);
    }

    // Guardar progreso
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
