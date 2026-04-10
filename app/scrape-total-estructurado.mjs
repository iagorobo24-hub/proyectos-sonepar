/**
 * Scraper Total Sonepar — Flujo Estructurado y Resumible
 * 1. Clic en Familia -> 2. Captura API -> 3. Clic "Siguiente" -> Repetir
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-total.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-final-sonepar.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Configuración de carga
const CONFIG = {
  maxProductsPerCategory: 50, // ⚠️ LIMITADOR DE SEGURIDAD: Sube esto a 100000 cuando estemos seguros
  delayBetweenClicks: 800,
};

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { currentCategoryIndex: 0, totalPages: 0, totalProducts: 0 };
}

function guardarProgreso(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// Familias exactas como aparecen en la web
const FAMILIAS = [
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
  console.log('🚀 Scraper Total Estructurado\n');

  let progreso = cargarProgreso();
  let productosGlobales = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { productosGlobales = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso: Familia ${progreso.currentCategoryIndex + 1}/${FAMILIAS.length} | ${productosGlobales.length} productos acumulados\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // 1. Interceptar API LovArticulos
  let bufferPaginaActual = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          bufferPaginaActual = body.dataRes;
          console.log(`      📦 Página cargada: ${body.dataRes.length} artículos`);
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

  // 3. Bucle por Familias
  for (let i = progreso.currentCategoryIndex; i < FAMILIAS.length; i++) {
    const familia = FAMILIAS[i];
    console.log(`\n📂 [${i + 1}/${FAMILIAS.length}] ${familia}`);

    // Resetear buffer para esta familia
    bufferPaginaActual = [];
    let productosFamilia = 0;
    let paginaActual = 1;

    // Hacer click en la familia
    try {
      // Buscar la caja específica
      const familyBox = await page.$(`.boxAreaNegocio:has-text("${familia}")`);
      if (familyBox) {
        await familyBox.click();
        console.log(`  ✅ Clic en ${familia}`);
      } else {
        console.log(`  ❌ No se encontró la caja de ${familia}`);
        continue;
      }
    } catch (err) {
      console.log(`  ⚠️ Error al hacer clic: ${err.message}`);
      continue;
    }

    await sleep(CONFIG.delayBetweenClicks);

    // 4. Bucle de Paginación
    while (true) {
      // Esperar a que el buffer se llene (viene del evento response)
      let intentos = 0;
      while (bufferPaginaActual.length === 0 && intentos < 10) {
        await sleep(500);
        intentos++;
      }

      if (bufferPaginaActual.length === 0) {
        console.log(`  ⏹️ Timeout esperando datos en página ${paginaActual}`);
        break;
      }

      // Procesar productos de esta página
      for (const art of bufferPaginaActual) {
        const ref = art.codigoArticulo || '';
        if (!ref || productosGlobales.find(p => p.ref === ref)) continue; // Evitar duplicados

        const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
        const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann|Simon|Niessen|Exzhellent)/i);

        productosGlobales.push({
          ref,
          desc,
          marca: marcaMatch?.[1] || '',
          familia: art.descFam1 || familia,
          subfamilia: art.descFam2 || '',
          tipo: art.descFam3 || '',
          precio: art.precioUnitario || '',
        });
      }
      
      productosFamilia += bufferPaginaActual.length;
      console.log(`    📄 Pág ${paginaActual}: +${bufferPaginaActual.length} (Total familia: ${productosFamilia})`);
      
      // Limpiar buffer para la siguiente iteración
      bufferPaginaActual = [];
      paginaActual++;

      // Comprobar límite de seguridad
      if (productosFamilia >= CONFIG.maxProductsPerCategory) {
        console.log(`    ⚠️ Límite de seguridad alcanzado (${CONFIG.maxProductsPerCategory})`);
        break;
      }

      // Buscar botón "Siguiente" (Chevron Right)
      try {
        // El paginador suele tener flechas. Buscamos el icono de siguiente
        const nextBtn = await page.$('i.material-icons:has-text("chevron_right"), .v-icon:has-text("chevron_right"), button:has(i:has-text("chevron_right"))');
        
        // Verificar si el botón está deshabilitado (clase disabled o similar)
        const isDisabled = await page.evaluate(btn => {
           return btn.parentElement.classList.contains('disabled') || 
                  btn.classList.contains('disabled') ||
                  btn.getAttribute('aria-disabled') === 'true';
        }, nextBtn);

        if (nextBtn && !isDisabled) {
          await nextBtn.click();
          await sleep(600); // Pausa para la petición
        } else {
          console.log(`    🏁 Fin de categoría (última página)`);
          break;
        }
      } catch (e) {
        console.log(`    🏁 Fin de categoría (no se encontró botón siguiente)`);
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
  
  // Limpiar progreso para la próxima vez
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ currentCategoryIndex: 0, totalPages: 0, totalProducts: 0 }));

  await browser.close();
}

main().catch(console.error);
