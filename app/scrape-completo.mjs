/**
 * Scraper Completo Sonepar — Extrae TODOS los productos via API LovArticulos
 * Navega cada subfamilia y captura los artículos reales
 * Guarda en formato compatible con catalogoSonepar.js
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Subfamilias encontradas (expandir con más familias)
const SUBFAMILIAS = [
  // CABLES
  { nombre: 'Cables Baja Tensión', familia: 'Cables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/cables' },
  { nombre: 'Cables de Datos', familia: 'Cables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/cables' },
  // DISTRIBUCIÓN
  { nombre: 'Aparamenta Modular', familia: 'Distribución', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/distribucion-potencia' },
  { nombre: 'Envolventes y Cuadros', familia: 'Distribución', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/distribucion-potencia' },
  // AUTOMATIZACIÓN
  { nombre: 'PLCs', familia: 'Automatización', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial' },
  { nombre: 'Variadores', familia: 'Automatización', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial' },
  { nombre: 'Contactores', familia: 'Automatización', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial' },
  { nombre: 'Sensores', familia: 'Automatización', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial' },
  { nombre: 'Relés', familia: 'Automatización', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial' },
  // ILUMINACIÓN
  { nombre: 'Luminarias', familia: 'Iluminación', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/iluminacion' },
  { nombre: 'Lámparas LED', familia: 'Iluminación', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/iluminacion' },
  // SOLAR/VE
  { nombre: 'Cargadores VE', familia: 'Energías Renovables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/energias-renovables' },
  { nombre: 'Paneles Solares', familia: 'Energías Renovables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/energias-renovables' },
  { nombre: 'Inversores', familia: 'Energías Renovables', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/energias-renovables' },
  // HERRAMIENTAS
  { nombre: 'Herramientas', familia: 'Seguridad', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/seguridad-herramientas' },
  // HVAC
  { nombre: 'Climatización', familia: 'HVAC', url: 'https://tienda.sonepar.es/tienda/#/catalogo/familia/hvac-climatizacion' },
];

async function main() {
  console.log('🚀 Scraper Completo — Todos los Productos Sonepar\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const todosLosProductos = [];
  const productosPorFamilia = {};

  // Interceptar API de artículos
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('LovArticulos') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body.dataRes && Array.isArray(body.dataRes)) {
          for (const art of body.dataRes) {
            // Extraer marca de la descripción
            const desc = art.descripcion || '';
            const marcaMatch = desc.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl\+Fuchs)/i);
            
            todosLosProductos.push({
              ref: art.codigoArticulo || art.codigo || '',
              desc: desc.replace(/<[^>]*>/g, '').trim(),
              marca: marcaMatch?.[1] || art.marca || 'Varias',
              precio: art.precioUnitario || art.precio || '',
              familia: '',
              subfamilia: '',
              url: `https://tienda.sonepar.es/tienda/#/catalogo/articulo/${art.codigoArticulo || ''}`,
            });
          }
          console.log(`    📦 +${body.dataRes.length} artículos`);
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

  // Iterar por cada familia/subfamilia
  for (let i = 0; i < SUBFAMILIAS.length; i++) {
    const sub = SUBFAMILIAS[i];
    const key = sub.familia;
    
    console.log(`\n[${i + 1}/${SUBFAMILIAS.length}] ${sub.familia} → ${sub.nombre}`);

    try {
      await page.goto(sub.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);

      // Scroll para cargar productos
      for (let s = 0; s < 15; s++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await sleep(500);
      }

      // Esperar a que lleguen los datos
      await sleep(2000);

      // Buscar y hacer clic en la subfamilia específica si es posible
      const subLinks = await page.evaluate((nombre) => {
        const links = [];
        document.querySelectorAll('a').forEach(a => {
          const text = a.textContent?.trim() || '';
          if (text.toLowerCase().includes(nombre.toLowerCase().substring(0, 8))) {
            links.push({ text, href: a.href || '' });
          }
        });
        return links;
      }, sub.nombre);

      if (subLinks.length > 0) {
        console.log(`    🔗 Subfamilia encontrada: ${subLinks[0].text}`);
      }

      // Guardar productos de esta familia
      const familiaProductos = todosLosProductos.filter(p => !p.familia);
      for (const p of familiaProductos) {
        p.familia = sub.familia;
        p.subfamilia = sub.nombre;
      }
      
      if (!productosPorFamilia[key]) productosPorFamilia[key] = [];
      productosPorFamilia[key].push(...familiaProductos);

    } catch (err) {
      console.log(`    ⚠️ Error: ${err.message.substring(0, 60)}`);
    }

    await sleep(2000);
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
    marca: p.marca,
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
  console.log(`Total artículos capturados: ${todosLosProductos.length}`);
  console.log(`Referencias únicas: ${productosUnicos.length}`);
  
  for (const [fam, prods] of Object.entries(productosPorFamilia)) {
    const refs = [...new Set(prods.map(p => p.ref))];
    console.log(`  ${fam.padEnd(25)} ${prods.length} artículos (${refs.length} refs únicas)`);
  }

  console.log(`\n💾 Archivos guardados:`);
  console.log(`  - todos-los-productos.json (${todosLosProductos.length} artículos)`);
  console.log(`  - catalogo-completo-app.json (${formatoApp.length} refs en formato app)`);

  // Mostrar primeras referencias
  if (productosUnicos.length > 0) {
    console.log('\n📋 Primeras 20 referencias:');
    for (const p of productosUnicos.slice(0, 20)) {
      console.log(`  ${p.ref.padEnd(18)} ${p.marca.padEnd(12)} ${p.familia}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
