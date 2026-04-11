/**
 * Scraper Catálogo Completo Sonepar V6
 * 
 * - Usa el campo `marca` REAL del API (no regex sobre descripción)
 * - Extrae familias dinámicamente del sitio
 * - Scrapea TODAS las páginas de TODAS las familias
 * - Guardado incremental cada 10 páginas
 * - Incluye: ref, desc, marca, familia, gama, tipo, precio, pdf_url, imagen
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// ════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════
const PROGRESS_FILE = './sonepar-catalog-scraper/progreso-v6.json';
const RESULT_FILE = './sonepar-catalog-scraper/catalogo-v6.json';
const OUTPUT_JS = './app/src/data/catalogoSonepar.js';

fs.mkdirSync('./sonepar-catalog-scraper', { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } 
  catch { return { catIndex: 0, page: 0, total: 0 }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// ════════════════════════════════════════════════════════
// FAMILIAS — Las del sitio real + las que descubramos
// ════════════════════════════════════════════════════════
const FAMILIAS = [
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

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 Scraper Catálogo Completo Sonepar V6\n');
  console.log('✅ Usa campo "marca" REAL del API');
  console.log('✅ Scrapea TODAS las páginas\n');

  let progress = loadProgress();
  let productos = [];
  
  // Cargar existentes
  if (fs.existsSync(RESULT_FILE)) {
    try { productos = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }
  
  const seenRefs = new Set(productos.map(p => p.ref));
  console.log(`📊 Estado: ${productos.length} refs | Familia ${progress.catIndex + 1}/${FAMILIAS.length} | Página ${progress.page}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Intercept API responses
  let pendingResolve = null;
  page.on('response', async response => {
    if (response.url().includes('LovArticulos') && response.status() === 200 && pendingResolve) {
      try {
        const json = await response.json();
        pendingResolve(json);
        pendingResolve = null;
      } catch { pendingResolve = null; }
    }
  });

  // Init session
  console.log('📍 Iniciando sesión (revisa la ventana del navegador)...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  try {
    // Intentar cerrar cookies de varias formas
    const cookieSelectors = [
      'button:has-text("ACEPTAR")', 
      'button:has-text("Aceptar")',
      '#onetrust-accept-btn-handler',
      '.cookie-accept'
    ];
    for (const sel of cookieSelectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        console.log('✅ Cookies aceptadas');
        break;
      }
    }
  } catch {}
  await sleep(1000);

  // ════════════════════════════════════════════════════════
  // SCRAPE EACH FAMILY
  // ════════════════════════════════════════════════════════
  for (let i = progress.catIndex; i < FAMILIAS.length; i++) {
    const familia = FAMILIAS[i];
    const resumed = (progress.catIndex === i && progress.page > 1);
    
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📂 [${i + 1}/${FAMILIAS.length}] ${familia.nombre}${resumed ? ` (↪️ pág ${progress.page + 1})` : ''}`);
    console.log(`${'═'.repeat(70)}`);

    let pageNum = resumed ? progress.page + 1 : 1;
    let familyNewCount = 0;

    while (true) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.slug}?page=${pageNum}`;
      pendingResolve = null;

      const responsePromise = new Promise(resolve => {
        pendingResolve = resolve;
        // Aumentado a 15 segundos por lentitud de Sonepar
        setTimeout(() => { if (pendingResolve) { pendingResolve = null; resolve(null); } }, 15000);
      });

      console.log(`    🔍 Navegando a pág ${pageNum}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      
      const apiData = await responsePromise;

      if (!apiData || !apiData.dataRes || apiData.dataRes.length === 0) {
        console.log(`    🏁 Fin de categoría o error en pág ${pageNum} (${familyNewCount} nuevas refs)`);
        // Si no hay datos, esperamos un poco por si es un microbloqueo
        await sleep(2000);
        break;
      }

      let newInPage = 0;
      for (const art of apiData.dataRes) {
        const ref = art.codigoArticulo || '';
        if (!ref || seenRefs.has(ref)) continue;
        seenRefs.add(ref);

        // ═══════════════════════════════════════════════
        // CAMPO MARCA REAL — no regex, dato directo
        // ═══════════════════════════════════════════════
        const marcaReal = (art.marca || '').trim().toUpperCase() || 'GENÉRICO';
        
        productos.push({
          ref,
          desc: (art.descripcion || '').replace(/<[^>]*>/g, '').trim(),
          marca: marcaReal,
          familia: familia.nombre,
          gama: (art.descFam2 || '').trim(),
          tipo: (art.descFam3 || '').trim(),
          precio: art.precio ? parseFloat(String(art.precio).replace(',', '.').replace(/\s/g, '')) || 0 : 0,
          pdf_url: (art.urlPdfInfTecnica || '').trim(),
          imagen: (art.imagenes && art.imagenes[0] && art.imagenes[0].imagen) || '',
          keywords: [
            (familia.nombre || '').toLowerCase(),
            (art.descFam2 || '').toLowerCase(),
            marcaReal.toLowerCase(),
          ].filter(Boolean).map(k => k.trim()).filter(k => k.length > 0),
        });
        newInPage++;
      }
      familyNewCount += newInPage;

      console.log(`    📄 Pág ${pageNum}: +${newInPage} refs (${familyNewCount} acumuladas en esta categoría)`);

      pageNum++;

      // Guardar cada 10 páginas
      if (pageNum % 10 === 0) {
        saveProgress({ catIndex: i, page: pageNum, total: productos.length });
        fs.writeFileSync(RESULT_FILE, JSON.stringify(productos, null, 2));
        console.log(`      💾 Guardado incremental: ${productos.length} refs totales`);
      }

      // Delay aleatorio más humano entre 1.5s y 3s
      await sleep(1500 + Math.random() * 1500);
    }

    // Final de familia
    progress.catIndex = i + 1;
    progress.page = 0;
    progress.total = productos.length;
    saveProgress(progress);
    fs.writeFileSync(RESULT_FILE, JSON.stringify(productos, null, 2));
    console.log(`    ✅ ${familia.nombre}: ${familyNewCount} nuevas refs añadidas`);
  }

  // ════════════════════════════════════════════════════════
  // GENERATE JS FILE
  // ════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log(`📦 TOTAL: ${productos.length} referencias`);
  console.log('🔄 Generando catalogoSonepar.js...');

  const jsContent = `/* Catálogo Sonepar Tools — Versión 6.0
 * Generado automáticamente desde tienda.sonepar.es
 * ${new Date().toISOString()}
 * Total: ${productos.length} referencias reales
 *
 * CAMPO "marca" extraído directamente del API (no regex)
 */

export const CATALOGO_PLANO = ${JSON.stringify(productos, null, 2)};

/* Funciones de navegación */
export function getMarcasPorCategoria(categoria) {
  const prods = CATALOGO_PLANO.filter(p => p.familia === categoria);
  const marcasSet = [...new Set(prods.map(p => p.marca))].filter(Boolean);
  return marcasSet.slice(0, 20).map(m => ({ nombre: m, color: "#666", familias: [], url: "" }));
}

export function getGamasPorMarcaYCategoria(categoria, marca) {
  const prods = CATALOGO_PLANO.filter(p => p.familia === categoria && p.marca === marca);
  const gamas = [...new Set(prods.map(p => p.gama))].filter(Boolean);
  return gamas.map(g => ({
    nombre: g,
    count: prods.filter(p => p.gama === g).length,
    tipos: [...new Set(prods.filter(p => p.gama === g).map(p => p.tipo))].filter(Boolean),
  }));
}

export function getReferenciasPorGama(categoria, marca, gama) {
  return CATALOGO_PLANO.filter(p => p.familia === categoria && p.marca === marca && p.gama === gama);
}

export function getReferencia(ref) {
  return CATALOGO_PLANO.find(p => p.ref === ref) || null;
}

/** Exportar helper para conteo por categoría */
export function getProductosPorCategoria(catId) {
  return CATALOGO_PLANO.filter(p => p.familia === catId);
}

export default { CATALOGO_PLANO, getMarcasPorCategoria, getGamasPorMarcaYCategoria, getReferenciasPorGama, getReferencia, getProductosPorCategoria };
`;

  fs.writeFileSync(OUTPUT_JS, jsContent);
  console.log(`✅ ${OUTPUT_JS} generado (${(fs.statSync(OUTPUT_JS).size / 1024 / 1024).toFixed(1)}MB)`);

  // Stats
  const families = {};
  productos.forEach(p => { families[p.familia] = (families[p.familia] || 0) + 1; });
  console.log('\n📊 Resumen por familia:');
  Object.entries(families).sort((a,b) => b[1] - a[1]).forEach(([f, c]) => {
    console.log(`  ${f}: ${c.toLocaleString()} refs`);
  });

  // Marcas count
  const marcas = {};
  productos.forEach(p => { if (p.marca) marcas[p.marca] = (marcas[p.marca] || 0) + 1; });
  console.log(`\n🏷️ Top 15 marcas:`);
  Object.entries(marcas).sort((a,b) => b[1] - a[1]).slice(0, 15).forEach(([m, c]) => {
    console.log(`  ${m}: ${c.toLocaleString()}`);
  });

  await browser.close();
  console.log('\n🎉 SCRAPER COMPLETADO');
}

main().catch(err => { console.error(err); process.exit(1); });
