/**
 * Scraper Total Sonepar V4 — Optimizado para Velocidad
 * Usa waitForResponse para evitar esperas innecesarias.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-total.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-final-sonepar.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Configuración Optimizada
const CONFIG = {
  maxProductsPerCategory: 50000, // Límite alto
  maxPagesPerCategory: 5000,     // Límite de páginas
};

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { currentCategoryIndex: 0, totalProducts: 0 };
}

function guardarProgreso(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

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
  console.log('🚀 Scraper Total V4 — Alta Velocidad\n');

  let progreso = cargarProgreso();
  let productosGlobales = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { productosGlobales = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso: Familia ${progreso.currentCategoryIndex + 1}/${FAMILIAS_MAP.length} | ${productosGlobales.length} productos\n`);

  const browser = await chromium.launch({ headless: true }); // Headless para más velocidad
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Interceptor de API
  let promiseRespuesta = null;
  page.on('response', response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      // Resolver la promesa cuando llegue la respuesta
      if (promiseRespuesta) {
        response.json().then(body => {
          if (promiseRespuesta) promiseRespuesta(body);
          promiseRespuesta = null;
        }).catch(() => { promiseRespuesta = null; });
      }
    }
  });

  // Inicio
  console.log('📍 Inicializando...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(1000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR")');
    if (btn) await btn.click();
  } catch {}
  await sleep(500);

  // Bucle por Familias
  for (let i = progreso.currentCategoryIndex; i < FAMILIAS_MAP.length; i++) {
    const familia = FAMILIAS_MAP[i];
    const baseURL = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.slug}`;
    
    console.log(`\n📂 [${i + 1}/${FAMILIAS_MAP.length}] ${familia.nombre}`);

    let productosFamilia = 0;
    let pageNum = 1;

    while (pageNum <= CONFIG.maxPagesPerCategory) {
      const targetURL = `${baseURL}?page=${pageNum}`;
      
      // Configurar promesa para esperar la respuesta de la API
      promiseRespuesta = null;
      let apiData = null;
      const responsePromise = new Promise(resolve => { promiseRespuesta = resolve; });

      // Navegar
      await page.goto(targetURL, { waitUntil: 'commit', timeout: 10000 }).catch(() => {});
      
      // Esperar respuesta de API con timeout
      try {
        apiData = await Promise.race([
          responsePromise,
          new Promise(r => setTimeout(() => r(null), 5000)) // 5s timeout
        ]);
      } catch (e) { apiData = null; }

      if (!apiData || !apiData.dataRes || apiData.dataRes.length === 0) {
        console.log(`    🏁 Fin de categoría (sin datos en pág ${pageNum})`);
        break;
      }

      // Procesar
      let nuevos = 0;
      for (const art of apiData.dataRes) {
        const ref = art.codigoArticulo || '';
        if (!ref || productosGlobales.find(p => p.ref === ref)) continue;

        const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
        const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann|Simon|Niessen|Exzhellent)/i);

        productosGlobales.push({
          ref, desc,
          marca: marcaMatch?.[1] || '',
          familia: familia.nombre,
          subfamilia: art.descFam2 || '',
          tipo: art.descFam3 || '',
          precio: art.precioUnitario || '',
        });
        nuevos++;
      }
      
      productosFamilia += nuevos;
      if (pageNum % 10 === 0 || nuevos > 0) {
        console.log(`    📄 Pág ${pageNum}: +${nuevos} (Total: ${productosFamilia})`);
      }
      
      pageNum++;

      // Guardar progreso cada 10 páginas para evitar pérdida de datos por timeout
      if (pageNum % 10 === 0) {
        fs.writeFileSync(RESULT_FILE, JSON.stringify(productosGlobales, null, 2));
        guardarProgreso({ currentCategoryIndex: i, totalProducts: productosGlobales.length, lastPage: pageNum });
      }

      if (productosFamilia >= CONFIG.maxProductsPerCategory) {
        console.log(`    ⚠️ Límite alcanzado`);
        break;
      }

      // Pausa mínima
      await sleep(200);
    }

    // Guardar
    progreso.currentCategoryIndex = i + 1;
    progreso.totalProducts = productosGlobales.length;
    guardarProgreso(progreso);
    fs.writeFileSync(RESULT_FILE, JSON.stringify(productosGlobales, null, 2));
  }

  console.log('\n' + '='.repeat(70));
  console.log('FINALIZADO');
  console.log('='.repeat(70));
  console.log(`Total productos: ${productosGlobales.length}`);
  
  await browser.close();
}

main().catch(console.error);
