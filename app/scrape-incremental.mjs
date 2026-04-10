/**
 * Scraper incremental del catálogo Sonepar
 * Usa API directa + scraping fallback
 * Guarda progreso continuamente
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-extraido.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Cargar progreso previo si existe
let progreso = { categorias: {}, total: 0 };
if (fs.existsSync(PROGRESS_FILE)) {
  try { progreso = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}
}

function guardarProgreso() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progreso, null, 2));
}

function guardarResultados(resultados) {
  fs.writeFileSync(RESULT_FILE, JSON.stringify(resultados, null, 2));
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Categorías principales basadas en estructura real encontrada anteriormente
const CATEGORIAS = [
  { nombre: 'Variadores', familia: 'Control de Velocidad y Accionamientos', subfamilia: 'Variadores de Frecuencia', cod: '06050101' },
  { nombre: 'Contactores', familia: 'Relés e Interfaces', subfamilia: 'Contactor Industrial', cod: '06040101' },
  { nombre: 'Guardamotores', familia: 'Control de Velocidad y Accionamientos', subfamilia: 'Protección Motor', cod: '06050104' },
  { nombre: 'PLCs', familia: 'Automatización y Control', subfamilia: 'Autómatas - PLCs', cod: '06020102' },
  { nombre: 'Relés', familia: 'Relés e Interfaces', subfamilia: 'Relés de Control y Supervisión', cod: '06040103' },
  { nombre: 'Sensores', familia: 'Detección Industrial', subfamilia: 'Sensórica de Detección/Medición/Encoders', cod: '06060101' },
  { nombre: 'Iluminación', familia: 'Dispositivos de Iluminación', subfamilia: 'Luminarias Interior Funcional', cod: '05010001' },
  { nombre: 'Cargadores VE', familia: 'Vehículo Eléctrico', subfamilia: 'Cargador AC', cod: '09040001' },
  { nombre: 'Paneles Solares', familia: 'Solar', subfamilia: 'Módulos Fotovoltaicos', cod: '09020001' },
  { nombre: 'Inversores', familia: 'Solar', subfamilia: 'Inversores de Conexión a Red', cod: '09020102' },
  { nombre: 'Magnetotérmicos', familia: 'Distribución Baja Tensión', subfamilia: 'Aparamenta Modular', cod: '02030101' },
  { nombre: 'Diferenciales', familia: 'Distribución Baja Tensión', subfamilia: 'Aparamenta Modular', cod: '02030101' },
  { nombre: 'Cables', familia: 'Cables de Baja Tensión', subfamilia: 'Cables de Energía 0,6/1KV', cod: '01010004' },
  { nombre: 'Herramientas', familia: 'Herramientas', subfamilia: 'Herramientas Manuales Aisladas VDE', cod: '07020202' },
  { nombre: 'HMI/Pantallas', familia: 'Automatización y Control', subfamilia: 'Interfaz Hombre Máquina - HMI', cod: '06020101' },
  { nombre: 'Motores', familia: 'Control de Velocidad y Accionamientos', subfamilia: 'Motores y Motorreductores', cod: '06050103' },
];

async function scrapeCategoria(browser, cat, resultados) {
  const key = `${cat.nombre}`;
  if (progreso.categorias[key]) {
    console.log(`  ⏭️ ${cat.nombre} — ya escrapeado (${progreso.categorias[key]} productos)`);
    return;
  }

  const page = await browser.newPage();
  let count = 0;

  try {
    // Intentar URL directa de subfamilia
    const url = `https://tienda.sonepar.es/tienda/#/catalogo/subfamilia/${cat.cod}`;
    console.log(`  📄 ${cat.nombre} → ${url.substring(0, 60)}...`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);

    // Scroll múltiple
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await sleep(500);
    }

    // Extraer productos
    const products = await page.evaluate(() => {
      const items = [];
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        const refMatch = line.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{2,})\b/);
        const priceMatch = line.match(/(\d+[,.]?\d{0,2})\s*€/);
        const brandMatch = line.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs)/i);

        if (refMatch && line.length > 15 && line.length < 200) {
          const ref = refMatch[1];
          // Evitar duplicados
          if (items.find(i => i.ref === ref)) continue;
          
          items.push({
            ref,
            desc: line.trim(),
            marca: brandMatch?.[1] || '',
            precio: priceMatch?.[0] || '',
          });
        }
      }
      return items.slice(0, 200); // Máx 200 por categoría
    });

    count = products.length;
    
    // Añadir a resultados
    for (const p of products) {
      resultados.push({
        ref: p.ref,
        desc: p.desc,
        marca: p.marca || 'Varias',
        familia: cat.familia,
        gama: cat.subfamilia,
        tipo: cat.nombre,
        precio: p.precio,
        pdf_url: '',
        imagen: '',
        keywords: [cat.nombre.toLowerCase(), cat.familia.toLowerCase(), p.marca?.toLowerCase() || ''].filter(Boolean),
      });
    }

    console.log(`    ✅ ${count} productos extraídos`);
    progreso.categorias[key] = count;
    progreso.total = Object.values(progreso.categorias).reduce((a, b) => a + b, 0);
    guardarProgreso();
    guardarResultados(resultados);

  } catch (error) {
    console.log(`    ⚠️ Error: ${error.message.substring(0, 60)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🚀 Scraper Catálogo Sonepar — Modo Incremental\n');
  
  const browser = await chromium.launch({ headless: true, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  // Página inicial para cookies
  console.log('📍 Inicializando sesión...');
  const initPage = await context.newPage();
  try {
    await initPage.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(2000);
    
    // Click aceptar cookies
    try {
      const btn = await initPage.$('button:has-text("ACEPTAR"), button:has-text("Aceptar"), [class*="accept"]');
      if (btn) { await btn.click(); await sleep(1000); }
    } catch {}
  } catch {}
  await initPage.close();

  let resultados = [];
  if (fs.existsSync(RESULT_FILE)) {
    try { resultados = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch {}
  }

  console.log(`📊 Progreso previo: ${progreso.total} productos en ${Object.keys(progreso.categorias).length} categorías\n`);

  for (const cat of CATEGORIAS) {
    await scrapeCategoria(browser, cat, resultados);
    await sleep(1000); // Pausa entre categorías
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`Total categorías: ${Object.keys(progreso.categorias).length}/${CATEGORIAS.length}`);
  console.log(`Total productos: ${progreso.total}`);
  console.log(`Archivo: ${RESULT_FILE}`);

  // Mostrar desglose
  for (const [cat, count] of Object.entries(progreso.categorias)) {
    console.log(`  ${cat.padEnd(20)} ${count} productos`);
  }

  // Generar formato para catalogoSonepar.js
  const jsFormat = resultados.map(p => ({
    ref: p.ref,
    desc: p.desc,
    marca: p.marca,
    familia: p.tipo,
    gama: p.gama,
    tipo: p.familia,
    precio: p.precio,
    pdf_url: p.pdf_url,
    keywords: p.keywords,
  }));

  const jsFile = path.join(OUTPUT_DIR, 'catalogo-para-app.json');
  fs.writeFileSync(jsFile, JSON.stringify(jsFormat, null, 2));
  console.log(`\n✅ Formato app guardado: ${jsFile}`);

  await browser.close();
}

main().catch(e => { console.error('Error fatal:', e.message); process.exit(1); });
