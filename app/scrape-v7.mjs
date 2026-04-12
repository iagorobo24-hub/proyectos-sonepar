/**
 * Scraper Catálogo Sonepar V7 — COMPLETO 24 CAMPOS
 * 
 * - Re-scrapea productos existentes para AMPLIAR campos faltantes
 * - Scrapea las 7 familias restantes que no se completaron
 * - 24 campos: refFabricante, docs, specs, imgs array, related, etc.
 * - Progreso incremental con recuperación por familia y página
 */

import { chromium } from 'playwright';
import fs from 'fs';

// ════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════
const PROGRESS_FILE = './sonepar-catalog-scraper/progreso-v7.json';
const RESULT_FILE = './sonepar-catalog-scraper/catalogo-v7.json';

fs.mkdirSync('./sonepar-catalog-scraper', { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { mode: 'ampliar', catIndex: 0, page: 0, total: 0, amplified: 0 }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// ════════════════════════════════════════════════════════
// FAMILIAS — Las 10 del sitio real
// ════════════════════════════════════════════════════════
const FAMILIAS = [
  { slug: 'cables', nombre: 'CABLES' },
  { slug: 'distribucion-potencia', nombre: 'DISTRIBUCION DE POTENCIA' },
  { slug: 'control-automatizacion-industrial', nombre: 'CONTROL Y AUTOMATIZACION INDUSTRIAL' },
  { slug: 'automatizacion-edificios', nombre: 'AUTOMATIZACION DE EDIFICIOS' },
  { slug: 'iluminacion', nombre: 'ILUMINACION' },
  { slug: 'hvac-climatizacion', nombre: 'HVAC' },
  { slug: 'seguridad-herramientas', nombre: 'SEGURIDAD Y HERRAMIENTAS' },
  { slug: 'fontaneria', nombre: 'FONTANERIA' },
  { slug: 'energias-renovables', nombre: 'ENERGIAS RENOVABLES' },
  { slug: 'servicios', nombre: 'SERVICIOS' },
];

// ════════════════════════════════════════════════════════
// MAPA DE CAMPOS API → MI BD (24 campos)
// ════════════════════════════════════════════════════════
function mapArticulo(art, familiaNombre) {
  const refFabricante = (art.refFabricante || art.refFabricante === 0) ? String(art.refFabricante).trim() : '';
  const refSonepar = (art.codigoArticulo || '').trim();
  const ref = refFabricante || refSonepar;

  // Parsear precio
  let precio = 0;
  if (art.precio) {
    precio = parseFloat(String(art.precio).replace(',', '.').replace(/\s/g, '')) || 0;
  }
  let pvp = 0;
  if (art.pvp) {
    pvp = parseFloat(String(art.pvp).replace('.', '').replace(',', '.').replace(/\s/g, '')) || 0;
  }

  // Imágenes
  const imagenes = (art.imagenes || []).map(img => img.imagen).filter(Boolean);

  return {
    // IDs
    ref,
    refSonepar,
    ean: (art.codigoEan || '').trim(),

    // Identificación
    nombre: (art.nombre || '').replace(/<[^>]*>/g, '').trim(),
    descripcion: (art.longText || art.descripcion || '').replace(/<[^>]*>/g, '').trim(),
    serie: (art.serie || '').trim(),

    // Marca / Fabricante
    marca: (art.marca || '').trim().toUpperCase() || 'GENÉRICO',
    fabricante: (art.nombreFabricante || '').trim(),
    logoFabricante: (art.manufacturerLogo || '').trim(),

    // Jerarquía
    familia: familiaNombre,
    gama: (art.descFam2 || '').trim(),
    tipo: (art.descFam3 || '').trim(),

    // Precios
    precio,
    pvp,

    // Stock / Logística
    stock: art.stock || 0,
    stockDisponible: art.estadoStock || 0,
    pedidoMinimo: art.pedidoMinimo || 1,
    cantidad: art.cantidad || 1,
    unidadMedida: (art.ume || '').trim(),

    // Documentos / Multimedia / Specs
    pdfUrl: (art.urlPdfInfTecnica || '').trim(),
    imagenes,                  // Array de URLs de imágenes
    documentos: (art.documentos || []).map(d => ({
      nombre: d.docName || '',
      tipo: d.docType || '',
      url: d.docUrl || ''
    })),
    specs: (art.caracteristicas || []).map(c => ({
      nombre: c.caracName || '',
      valor: c.caracValue || ''
    })),
    relacionados: (art.relatedProducts || []).filter(Boolean),

    // Keywords para búsqueda
    keywords: [
      refFabricante.toLowerCase(),
      refSonepar.toLowerCase(),
      (art.marca || '').toLowerCase(),
      (art.nombre || '').toLowerCase(),
      (familiaNombre || '').toLowerCase(),
      (art.descFam2 || '').toLowerCase(),
      (art.descFam3 || '').toLowerCase(),
    ].filter(k => k && k.length > 1),
  };
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 Scraper Catálogo Sonepar V7 — 24 CAMPOS COMPLETOS\n');
  console.log('✅ Ref fabricante (primary) + Ref Sonepar (secundaria)');
  console.log('✅ 24 campos: docs, specs, imgs array, related, etc.');
  console.log('✅ Re-scrapea existentes para ampliar campos');
  console.log('✅ Scrapea familias restantes\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Intercept API
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

  // Init
  console.log('📍 Iniciando sesión (revisa la ventana del navegador)...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // Accept cookies
  try {
    for (const sel of ['button:has-text("ACEPTAR")', 'button:has-text("Aceptar")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); console.log('✅ Cookies aceptadas'); break; }
    }
  } catch {}
  await sleep(1000);

  // Cargar progreso y productos existentes
  let progress = loadProgress();
  let productos = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { productos = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }
  
  // Cargar v6 existente para ampliar
  if (productos.length === 0 && fs.existsSync('./sonepar-catalog-scraper/catalogo-v6.json')) {
    try {
      productos = JSON.parse(fs.readFileSync('./sonepar-catalog-scraper/catalogo-v6.json', 'utf8'));
      console.log(`📂 Cargados ${productos.length} productos de catalogo-v6.json para ampliar`);
    } catch {}
  }

  console.log(`📊 Estado actual: ${productos.length} productos existentes`);
  console.log(`📋 Modo: ${progress.mode === 'ampliar' ? 'Ampliando campos faltantes' : 'Scrapeando familias nuevas'}`);
  console.log(`📍 Familia ${progress.catIndex + 1}/${FAMILIAS.length} | Página ${progress.page}\n`);

  let totalAmplified = progress.amplified || 0;
  let totalNew = 0;

  // ════════════════════════════════════════════════════════
  // SCRAPE / AMPLIAR FAMILIAS
  // ════════════════════════════════════════════════════════
  for (let i = progress.catIndex || 0; i < FAMILIAS.length; i++) {
    const familia = FAMILIAS[i];
    const resumed = ((progress.catIndex || 0) === i && (progress.page || 0) > 0);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📂 [${i + 1}/${FAMILIAS.length}] ${familia.nombre}${resumed ? ` (↪️ pág ${(progress.page || 0) + 1})` : ''}`);
    console.log(`${'═'.repeat(70)}`);

    let pageNum = resumed ? (progress.page || 0) + 1 : 1;
    let familyAmplified = 0;
    let familyNew = 0;

    // Mapa de productos existentes de esta familia para ampliar
    const existingByRefSonepar = {};
    const existingByRefFabricante = {};
    for (const p of productos) {
      if (p.familia === familia.nombre) {
        if (p.refSonepar) existingByRefSonepar[p.refSonepar] = p;
        if (p.ref && p.ref !== p.refSonepar) existingByRefFabricante[p.ref] = p;
      }
    }
    console.log(`    📋 ${Object.keys(existingByRefSonepar).length} productos existentes para ampliar`);

    while (true) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${familia.slug}?page=${pageNum}`;
      pendingResolve = null;

      const responsePromise = new Promise(resolve => {
        pendingResolve = resolve;
        setTimeout(() => { if (pendingResolve) { pendingResolve = null; resolve(null); } }, 15000);
      });

      console.log(`    🔍 Navegando a pág ${pageNum}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await sleep(1000);

      const apiData = await responsePromise;

      if (!apiData || !apiData.dataRes || apiData.dataRes.length === 0) {
        if (pageNum === 1) {
          console.log(`    ⚠️  Familia vacía o slug incorrect: ${familia.slug}`);
        } else {
          console.log(`    🏁 Fin en pág ${pageNum - 1} (+${familyAmplified} ampliados, +${familyNew} nuevos)`);
        }
        break;
      }

      for (const art of apiData.dataRes) {
        const mapped = mapArticulo(art, familia.nombre);
        if (!mapped.ref) continue;

        // Buscar existente por refSonepar
        const existing = existingByRefSonepar[mapped.refSonepar] || existingByRefFabricante[mapped.ref];

        if (existing) {
          // AMPLIAR: fusionar datos nuevos con existentes
          const before = JSON.stringify(existing);
          existing.ref = mapped.ref; // Actualizar ref primaria
          existing.refSonepar = mapped.refSonepar || existing.refSonepar;
          existing.ean = mapped.ean || existing.ean;
          existing.nombre = mapped.nombre || existing.nombre;
          existing.descripcion = mapped.descripcion || existing.desc || existing.descripcion;
          existing.serie = mapped.serie || existing.serie;
          existing.marca = mapped.marca || existing.marca;
          existing.fabricante = mapped.fabricante || existing.fabricante;
          existing.logoFabricante = mapped.logoFabricante || existing.logoFabricante;
          existing.familia = mapped.familia || existing.familia;
          existing.gama = mapped.gama || existing.gama || existing.subfamilia;
          existing.tipo = mapped.tipo || existing.tipo || existing.categoria;
          existing.precio = mapped.precio || existing.precio;
          existing.pvp = mapped.pvp || existing.pvp;
          existing.stock = mapped.stock !== undefined ? mapped.stock : (existing.stock || 0);
          existing.stockDisponible = mapped.stockDisponible || existing.stockDisponible;
          existing.pedidoMinimo = mapped.pedidoMinimo || existing.pedidoMinimo;
          existing.cantidad = mapped.cantidad || existing.cantidad;
          existing.unidadMedida = mapped.unidadMedida || existing.unidadMedida;
          existing.pdfUrl = mapped.pdfUrl || existing.pdf_url || existing.pdfUrl;
          existing.imagenes = mapped.imagenes.length > 0 ? mapped.imagenes : (existing.imagenes || [existing.imagen].filter(Boolean));
          existing.imagen = existing.imagenes[0] || ''; // Mantener compatibilidad
          existing.documentos = mapped.documentos.length > 0 ? mapped.documentos : (existing.documentos || []);
          existing.specs = mapped.specs.length > 0 ? mapped.specs : (existing.specs || []);
          existing.relacionados = mapped.relacionados.length > 0 ? mapped.relacionados : (existing.relacionados || []);
          existing.keywords = mapped.keywords.length > 0 ? mapped.keywords : (existing.keywords || []);

          const after = JSON.stringify(existing);
          if (before !== after) {
            familyAmplified++;
            totalAmplified++;
          }
        } else {
          // NUEVO producto
          productos.push(mapped);
          familyNew++;
          totalNew++;
          existingByRefSonepar[mapped.refSonepar] = mapped;
        }
      }

      console.log(`    📄 Pág ${pageNum}: +${familyAmplified} ampl., +${familyNew} nuevos`);

      pageNum++;

      // Guardar cada 5 páginas
      if (pageNum % 5 === 0) {
        fs.writeFileSync(RESULT_FILE, JSON.stringify(productos, null, 2));
        progress = { mode: 'ampliar', catIndex: i, page: pageNum, total: productos.length, amplified: totalAmplified };
        saveProgress(progress);
        console.log(`    💾 Guardado: ${productos.length.toLocaleString()} total, ${totalAmplified.toLocaleString()} ampliados`);
        await sleep(2000);
      }

      await sleep(1500);
    }

    // Guardar fin de familia
    fs.writeFileSync(RESULT_FILE, JSON.stringify(productos, null, 2));
    progress = { mode: 'ampliar', catIndex: i + 1, page: 0, total: productos.length, amplified: totalAmplified };
    saveProgress(progress);
    console.log(`✅ Familia completada: ${familyAmplified} ampliados, ${familyNew} nuevos`);
  }

  // ════════════════════════════════════════════════════════
  // FINAL
  // ════════════════════════════════════════════════════════
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📦 TOTAL: ${productos.length.toLocaleString()} referencias`);
  console.log(`🔄 Ampliados: ${totalAmplified.toLocaleString()} productos con campos nuevos`);
  console.log(`🆕 Nuevos: ${totalNew.toLocaleString()} productos añadidos`);

  // Stats por familia
  const families = {};
  productos.forEach(p => { families[p.familia] = (families[p.familia] || 0) + 1; });
  console.log('\n📊 Resumen por familia:');
  Object.entries(families).sort((a,b) => b[1] - a[1]).forEach(([f, c]) => {
    console.log(`  ${f}: ${c.toLocaleString()} refs`);
  });

  // Marcas
  const marcas = {};
  productos.forEach(p => { if (p.marca) marcas[p.marca] = (marcas[p.marca] || 0) + 1; });
  console.log(`\n🏷️ Top 15 marcas:`);
  Object.entries(marcas).sort((a,b) => b[1] - a[1]).slice(0, 15).forEach(([m, c]) => {
    console.log(`  ${m}: ${c.toLocaleString()}`);
  });

  // Verificar campos completos
  const sample = productos[0] || {};
  const camposCount = Object.keys(sample).length;
  const conDocs = productos.filter(p => p.documentos && p.documentos.length > 0).length;
  const conSpecs = productos.filter(p => p.specs && p.specs.length > 0).length;
  const conImgs = productos.filter(p => p.imagenes && p.imagenes.length > 0).length;
  const conRelated = productos.filter(p => p.relacionados && p.relacionados.length > 0).length;
  const conRefFab = productos.filter(p => p.ref && p.ref !== p.refSonepar).length;

  console.log(`\n📋 Calidad de campos (${camposCount} campos por producto):`);
  console.log(`  Ref fabricante: ${conRefFab.toLocaleString()} (${(conRefFab/productos.length*100).toFixed(0)}%)`);
  console.log(`  Documentos: ${conDocs.toLocaleString()} (${(conDocs/productos.length*100).toFixed(0)}%)`);
  console.log(`  Specs técnicas: ${conSpecs.toLocaleString()} (${(conSpecs/productos.length*100).toFixed(0)}%)`);
  console.log(`  Imágenes: ${conImgs.toLocaleString()} (${(conImgs/productos.length*100).toFixed(0)}%)`);
  console.log(`  Relacionados: ${conRelated.toLocaleString()} (${(conRelated/productos.length*100).toFixed(0)}%)`);

  fs.writeFileSync(RESULT_FILE, JSON.stringify(productos, null, 2));
  console.log(`\n💾 Guardado: ${RESULT_FILE} (${(fs.statSync(RESULT_FILE).size / 1024 / 1024).toFixed(1)} MB)`);

  await browser.close();
  console.log('\n🎉 SCRAPER V7 COMPLETADO');
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
