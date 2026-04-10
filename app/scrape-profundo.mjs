/**
 * Scraper Sonepar — Navegación profunda: Familia → Subfamilia → Productos
 * Extrae productos reales del DOM de la tienda
 * Progreso continuo y resumible
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-profundo.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-profundo.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cargarProgreso() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
  }
  return { familias: {}, total: 0 };
}

function guardarProgreso(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }
function guardarResultados(r) { fs.writeFileSync(RESULT_FILE, JSON.stringify(r, null, 2)); }

// Estructura real del catálogo desde la API
const ESTRUCTURA = [
  {
    familia: 'Cables', url: 'cables',
    subs: [
      { nombre: 'Cables Baja Tensión', cod: 'F_1.1' },
      { nombre: 'Cables de Datos', cod: 'F_1.2' },
    ]
  },
  {
    familia: 'Distribución de Potencia', url: 'distribucion-potencia',
    subs: [
      { nombre: 'Gestión de Cableado', cod: 'F_2.1' },
      { nombre: 'Envolventes y Cuadros', cod: 'F_2.2' },
      { nombre: 'Distribución Baja Tensión', cod: 'F_2.3' },
    ]
  },
  {
    familia: 'Control y Automatización', url: 'control-automatizacion-industrial',
    subs: [
      { nombre: 'Automatización y Control', cod: 'F_6.2' },
      { nombre: 'Relés e Interfaces', cod: 'F_6.4' },
      { nombre: 'Control de Velocidad', cod: 'F_6.5' },
      { nombre: 'Detección Industrial', cod: 'F_6.6' },
    ]
  },
  {
    familia: 'Iluminación', url: 'iluminacion',
    subs: [
      { nombre: 'Dispositivos de Iluminación', cod: 'F_5.1' },
      { nombre: 'Lámparas', cod: 'F_5.3' },
    ]
  },
  {
    familia: 'Energías Renovables y VE', url: 'energias-renovables',
    subs: [
      { nombre: 'Solar', cod: 'F_9.2' },
      { nombre: 'Vehículo Eléctrico', cod: 'F_9.4' },
    ]
  },
  {
    familia: 'Seguridad y Herramientas', url: 'seguridad-herramientas',
    subs: [
      { nombre: 'Equipamiento de Seguridad', cod: 'F_7.1' },
      { nombre: 'Herramientas', cod: 'F_7.2' },
    ]
  },
];

async function scrapeFamilia(page, familia) {
  console.log(`\n  📂 ${familia.familia}`);
  
  // Navegar a la familia
  await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.url}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });
  await sleep(3000);

  // Buscar y hacer clic en cada subfamilia
  for (const sub of familia.subs) {
    const key = `${familia.familia} > ${sub.nombre}`;
    if (globalProgress.familias[key]) {
      console.log(`    ⏭️ ${sub.nombre} — ya hecho (${globalProgress.familias[key]} refs)`);
      continue;
    }

    console.log(`    🔍 ${sub.nombre}...`);

    try {
      // Buscar el enlace de la subfamilia en la página
      const subLink = await page.$(`a:has-text("${sub.nombre}"), [class*="sub"]:has-text("${sub.nombre}")`);
      
      if (subLink) {
        await subLink.click();
        await sleep(3000);
      } else {
        // Intentar URL directa de subfamilia
        await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/subfamilia/${sub.cod}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        await sleep(3000);
      }

      // Scroll para cargar productos
      for (let i = 0; i < 20; i++) {
        await page.evaluate(() => window.scrollBy(0, 1500));
        await sleep(600);
      }

      // Extraer productos
      const products = await page.evaluate(() => {
        const items = [];
        const seenRefs = new Set();
        
        // Obtener todo el texto del body
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').filter(l => l.trim().length > 10 && l.trim().length < 300);

        for (const line of lines) {
          // Buscar referencia industrial
          const refMatch = line.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{2,})\b/);
          const priceMatch = line.match(/(\d+[,.]?\d{0,2})\s*€/);
          const brandMatch = line.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl)/i);

          if (refMatch && !seenRefs.has(refMatch[1])) {
            // Validar que parezca una referencia real
            const ref = refMatch[1];
            if (ref.length >= 5 && ref.length <= 25 && /\d/.test(ref)) {
              seenRefs.add(ref);
              items.push({
                ref,
                desc: line.trim(),
                marca: brandMatch?.[1] || '',
                precio: priceMatch?.[0] || '',
              });
            }
          }
        }
        return items;
      });

      console.log(`      ✅ ${products.length} referencias extraídas`);

      // Guardar
      for (const p of products) {
        globalResultados.push({
          ref: p.ref,
          desc: p.desc,
          marca: p.marca || 'Varias',
          familia: familia.familia,
          subfamilia: sub.nombre,
          precio: p.precio,
        });
      }

      globalProgress.familias[key] = products.length;
      globalProgress.total = Object.values(globalProgress.familias).reduce((a, b) => a + b, 0);
      guardarProgreso(globalProgress);
      guardarResultados(globalResultados);

    } catch (err) {
      console.log(`      ⚠️ Error: ${err.message.substring(0, 60)}`);
      globalProgress.familias[key] = { error: err.message.substring(0, 100) };
      guardarProgreso(globalProgress);
    }

    await sleep(1000);
  }
}

let globalProgress = cargarProgreso();
let globalResultados = [];
if (fs.existsSync(RESULT_FILE)) {
  try { globalResultados = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
}

async function main() {
  console.log('🚀 Scraper Profundo Sonepar — Familia → Subfamilia → Productos\n');
  console.log(`📊 Progreso: ${globalProgress.total} referencias en ${Object.keys(globalProgress.familias).length} subfamilias\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
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

  const page = await context.newPage();

  for (const familia of ESTRUCTURA) {
    await scrapeFamilia(page, familia);
    await sleep(2000);
  }

  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN');
  console.log('='.repeat(70));
  
  const refsUnicas = [...new Set(globalResultados.map(r => r.ref))];
  console.log(`Total entradas: ${globalResultados.length}`);
  console.log(`Referencias únicas: ${refsUnicas.length}`);
  console.log(`Subfamilias procesadas: ${Object.keys(globalProgress.familias).length}`);

  if (refsUnicas.length > 0) {
    console.log('\nPrimeras 20 referencias:');
    for (const ref of refsUnicas.slice(0, 20)) {
      const prod = globalResultados.find(r => r.ref === ref);
      console.log(`  ${ref.padEnd(18)} ${prod?.marca?.padEnd(12) || ''} ${prod?.subfamilia || ''}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
