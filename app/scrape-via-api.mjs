/**
 * Scraper Sonepar via API directa
 * 1. Obtiene estructura completa del catálogo via API
 * 2. Navega a cada familia para extraer productos reales
 * 3. Guarda resultados incrementales
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🚀 Scraper Sonepar via API\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Capturar respuesta del catálogo
  let catalogoData = null;
  page.on('response', async response => {
    if (response.url().includes('wseportal/portal/catalogo') && response.status() === 200) {
      try {
        catalogoData = await response.json();
        console.log('✅ Datos del catálogo capturados\n');
      } catch {}
    }
  });

  // Cargar tienda
  console.log('📍 Cargando tienda...');
  await page.goto('https://tienda.sonepar.es/tienda/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // Esperar a que lleguen los datos del catálogo
  for (let i = 0; i < 10; i++) {
    if (catalogoData) break;
    await sleep(1000);
  }

  if (!catalogoData) {
    console.log('❌ No se pudieron obtener datos del catálogo');
    await browser.close();
    return;
  }

  // Analizar estructura
  console.log('📂 Analizando estructura del catálogo...\n');
  const familias = catalogoData.dataRes?.familias || [];
  console.log(`${familias.length} familias encontradas\n`);

  const estructura = [];

  for (const fam of familias) {
    const item = {
      nombre: fam.nombre || fam.descripcion?.substring(0, 60) || 'Sin nombre',
      codigo: fam.codigo,
      articulos: fam.numArticulos || 0,
      subfamilias: [],
    };

    if (fam.familias && fam.familias.length > 0) {
      for (const sub of fam.familias) {
        const subItem = {
          nombre: sub.nombre || sub.descripcion?.substring(0, 60) || 'Sin nombre',
          codigo: sub.codigo,
          articulos: sub.numArticulos || 0,
        };
        item.subfamilias.push(subItem);
      }
    }

    estructura.push(item);
  }

  // Guardar estructura
  fs.writeFileSync(path.join(OUTPUT_DIR, 'estructura-catalogo.json'), JSON.stringify(estructura, null, 2));
  console.log('📋 Estructura guardada\n');

  // Mostrar familias relevantes para nuestra app
  console.log('Familias relevantes:\n');
  const keywords = ['variador', 'contactor', 'guardamotor', 'automata', 'plc', 'relé', 'sensor', 'detección', 'luminaria', 'iluminación', 'cargador', 'vehículo', 'solar', 'fotovoltaic', 'magnetotérmico', 'diferencial', 'protección', 'aparamenta', 'motor', 'herramienta', 'hmi'];
  
  for (const fam of estructura) {
    const famLower = fam.nombre.toLowerCase();
    const subsRelevantes = fam.subfamilias.filter(s => keywords.some(kw => s.nombre.toLowerCase().includes(kw)));
    
    if (subsRelevantes.length > 0 || keywords.some(kw => famLower.includes(kw))) {
      console.log(`📁 ${fam.nombre} (${fam.articulos} artículos)`);
      for (const sub of subsRelevantes) {
        console.log(`   └─ ${sub.nombre} (${sub.articulos} artículos)`);
      }
      console.log('');
    }
  }

  // Ahora extraer productos de las subfamilias más relevantes
  console.log('\n' + '='.repeat(60));
  console.log('EXTRAYENDO PRODUCTOS DE SUBFAMILIAS RELEVANTES');
  console.log('='.repeat(60) + '\n');

  const subfamiliasRelevantes = [];
  for (const fam of estructura) {
    for (const sub of fam.subfamilias) {
      if (keywords.some(kw => sub.nombre.toLowerCase().includes(kw)) && sub.articulos > 0) {
        subfamiliasRelevantes.push({ familia: fam.nombre, ...sub });
      }
    }
  }

  console.log(`${subfamiliasRelevantes.length} subfamilias relevantes encontradas\n`);

  // Limitar a las 20 más grandes para no tardar eternamente
  const topSubs = subfamiliasRelevantes.sort((a, b) => b.articulos - a.articulos).slice(0, 20);

  const resultados = [];

  for (const sub of topSubs) {
    console.log(`\n📄 ${sub.nombre} (${sub.articulos} artículos)...`);
    
    const subPage = await context.newPage();
    
    try {
      // Navegar a la subfamilia usando el código
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/subfamilia/${sub.codigo}`;
      await subPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);

      // Hacer scroll para cargar productos
      for (let i = 0; i < 10; i++) {
        await subPage.evaluate(() => window.scrollBy(0, 1000));
        await sleep(500);
      }

      // Capturar productos
      const products = await subPage.evaluate(() => {
        const items = [];
        const allElements = document.querySelectorAll('*');
        const seen = new Set();

        for (const el of allElements) {
          const text = el.textContent?.trim();
          if (!text || text.length < 15 || text.length > 200) continue;
          if (seen.has(text)) continue;

          // Buscar patrón de referencia industrial
          const refMatch = text.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{3,})\b/);
          const priceMatch = text.match(/(\d+[,.]?\d{0,2})\s*€/);
          const brandMatch = text.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl)/i);

          if (refMatch && (priceMatch || brandMatch)) {
            seen.add(text);
            items.push({
              ref: refMatch[1],
              desc: text,
              marca: brandMatch?.[1] || '',
              precio: priceMatch?.[0] || '',
            });
          }
        }
        return items.slice(0, 50);
      });

      console.log(`  ✅ ${products.length} productos extraídos`);

      for (const p of products) {
        resultados.push({
          ref: p.ref,
          desc: p.desc,
          marca: p.marca || 'Varias',
          familia: sub.nombre,
          gama: sub.familia,
          tipo: sub.nombre,
          precio: p.precio,
        });
      }

    } catch (err) {
      console.log(`  ⚠️ Error: ${err.message.substring(0, 50)}`);
    } finally {
      await subPage.close();
    }

    // Guardar progreso
    fs.writeFileSync(path.join(OUTPUT_DIR, 'productos-extraidos.json'), JSON.stringify(resultados, null, 2));
    await sleep(2000);
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(60));
  console.log(`Total productos extraídos: ${resultados.length}`);
  console.log(`Archivo: ${OUTPUT_DIR}/productos-extraidos.json`);

  // Mostrar referencias únicas
  const refsUnicas = [...new Set(resultados.map(r => r.ref))];
  console.log(`Referencias únicas: ${refsUnicas.length}`);
  console.log('\nPrimeras 20 referencias:');
  for (const ref of refsUnicas.slice(0, 20)) {
    const prod = resultados.find(r => r.ref === ref);
    console.log(`  ${ref.padEnd(20)} ${prod?.marca?.padEnd(15) || ''} ${prod?.precio || ''}`);
  }

  await browser.close();
}

main().catch(console.error);
