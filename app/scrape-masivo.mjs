/**
 * Scraper Final Sonepar — Captura masiva via LovArticulos con paginación
 * Extrae TODOS los productos reales de la tienda
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🚀 Scraper Masivo Sonepar — API LovArticulos\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const todosLosProductos = [];
  let totalRegistros = 0;

  // Capturar respuesta de LovArticulos
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          // Guardar numReg si existe
          if (body.numReg && !totalRegistros) {
            totalRegistros = body.numReg;
            console.log(`  📊 Total registros en API: ${totalRegistros.toLocaleString()}`);
          }
          
          for (const art of body.dataRes) {
            const desc = (art.descripcion || '').replace(/<[^>]*>/g, '').trim();
            const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs|General Cable|Prysmian|Nexans|Legrand|Hellermann)/i);
            
            todosLosProductos.push({
              ref: art.codigoArticulo || '',
              desc: desc,
              marca: marcaMatch?.[1] || art.marca || '',
              familia: art.descFam1 || '',
              subfamilia: art.descFam2 || '',
              tipo: art.descFam3 || '',
              codigoMercado: art.codigoMercado || '',
              precio: art.precioUnitario || '',
              url: `https://tienda.sonepar.es/tienda/#/catalogo/articulo/${art.codigoArticulo}`,
            });
          }
        }
      } catch {}
    }
  });

  // Inicializar sesión
  console.log('📍 Inicializando sesión...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
    if (btn) { await btn.click(); await sleep(1000); }
  } catch {}

  // Navegar al catálogo completo
  console.log('\n📍 Cargando catálogo completo...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // Hacer scroll agresivo para cargar TODOS los productos
  console.log('\n📍 Scroll masivo para cargar productos...');
  let prevCount = 0;
  let sinCambios = 0;

  for (let i = 0; i < 100; i++) {
    await page.evaluate(() => window.scrollBy(0, 3000));
    await sleep(400);

    if (i % 20 === 0) {
      const currentCount = todosLosProductos.length;
      console.log(`  📜 Scroll ${i}/100 — ${currentCount} productos capturados (total API: ${totalRegistros || '?'})`);
    }

    if (todosLosProductos.length === prevCount) {
      sinCambios++;
      if (sinCambios > 10 && todosLosProductos.length > 0) {
        console.log(`  ⏹️ Sin cambios tras ${sinCambios} scrolls`);
        break;
      }
    } else {
      sinCambios = 0;
    }
    prevCount = todosLosProductos.length;

    // Si ya tenemos suficientes, parar
    if (todosLosProductos.length >= 5000) {
      console.log(`  ✅ ${todosLosProductos.length} productos alcanzados, deteniendo`);
      break;
    }
  }

  // Eliminar duplicados por referencia
  const seen = new Set();
  const productosUnicos = todosLosProductos.filter(p => {
    if (!p.ref || seen.has(p.ref)) return false;
    seen.add(p.ref);
    return true;
  });

  // Guardar resultados
  fs.writeFileSync(path.join(OUTPUT_DIR, 'todos-los-productos.json'), JSON.stringify(productosUnicos, null, 2));

  // Generar formato para catalogoSonepar.js
  const formatoApp = productosUnicos.map(p => ({
    ref: p.ref,
    desc: p.desc,
    marca: p.marca || 'Varias',
    familia: p.subfamilia || p.familia,
    gama: p.familia,
    tipo: p.subfamilia,
    precio: p.precio ? `${p.precio}€` : '',
    pdf_url: p.url,
    imagen: '',
    keywords: [p.familia.toLowerCase(), p.marca.toLowerCase(), p.subfamilia.toLowerCase()].filter(Boolean),
  }));

  fs.writeFileSync(path.join(OUTPUT_DIR, 'catalogo-completo-app.json'), JSON.stringify(formatoApp, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));
  console.log(`Total capturados: ${todosLosProductos.length}`);
  console.log(`Referencias únicas: ${productosUnicos.length}`);
  console.log(`Total en API: ${totalRegistros || 'desconocido'}`);

  // Desglose por familia
  const porFamilia = {};
  for (const p of productosUnicos) {
    const fam = p.familia || 'Sin familia';
    if (!porFamilia[fam]) porFamilia[fam] = [];
    porFamilia[fam].push(p);
  }

  for (const [fam, prods] of Object.entries(porFamilia)) {
    const marcas = [...new Set(prods.map(p => p.marca).filter(Boolean))];
    console.log(`  ${fam.padEnd(40)} ${prods.length} refs · Marcas: ${marcas.slice(0, 5).join(', ')}${marcas.length > 5 ? '...' : ''}`);
  }

  // Marcas más comunes
  const marcasCount = {};
  for (const p of productosUnicos) {
    if (p.marca) marcasCount[p.marca] = (marcasCount[p.marca] || 0) + 1;
  }
  const topMarcas = Object.entries(marcasCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\n🏷️ Top marcas:');
  for (const [marca, count] of topMarcas) {
    console.log(`  ${marca.padEnd(20)} ${count} refs`);
  }

  console.log(`\n💾 Archivos:`);
  console.log(`  - todos-los-productos.json (${productosUnicos.length} refs)`);
  console.log(`  - catalogo-completo-app.json (formato app)`);

  // Primeras referencias
  console.log('\n📋 Primeras 10 referencias:');
  for (const p of productosUnicos.slice(0, 10)) {
    console.log(`  ${p.ref.padEnd(18)} ${p.marca.padEnd(15)} ${p.familia}`);
  }

  await browser.close();
}

main().catch(console.error);
