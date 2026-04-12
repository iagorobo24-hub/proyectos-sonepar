import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Verificando slugs reales con datos de página 1...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  try {
    for (const sel of ['button:has-text("ACEPTAR")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); break; }
    }
  } catch {}
  await sleep(1000);

  // Candidate slugs with unique totals
  const candidates = [
    { slug: 'seguridad-herramientas', expected: 'SEGURIDAD Y HERRAMIENTAS' },
    { slug: 'herramientas', expected: 'HERRAMIENTAS' },
    { slug: 'fontaneria', expected: 'FONTANERIA' },
    { slug: 'solar', expected: 'SOLAR' },
    { slug: 'servicios', expected: 'SERVICIOS' },
    { slug: 'climatizacion', expected: 'CLIMATIZACION' },
    { slug: 'energias-renovables', expected: 'ENERGIAS RENOVABLES' },
  ];

  const realFamilies = [];

  for (const cand of candidates) {
    console.log(`\n=== ${cand.expected} → "${cand.slug}" ===`);

    // Navigate to family page
    await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${cand.slug}?page=1`, {
      waitUntil: 'domcontentloaded', timeout: 10000
    }).catch(() => {});
    await sleep(3000);

    // Get API response with product data
    const result = await new Promise(resolve => {
      let resolved = false;
      const handler = async (response) => {
        if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
          try {
            const json = await response.json();
            const products = json.dataRes || [];
            if (products.length > 0) {
              // Check if products match this family
              const sampleProducts = products.slice(0, 3).map(p => ({
                ref: p.codigoArticulo,
                desc: (p.descripcion || '').substring(0, 60),
                marca: p.marca,
                fam1: p.descFam1,
                fam2: p.descFam2,
                fam3: p.descFam3,
              }));
              resolved = true;
              resolve({
                slug: cand.slug,
                nombre: cand.expected,
                count: products.length,
                numReg: json.numReg || 0,
                sample: sampleProducts
              });
            } else {
              resolved = true;
              resolve({ slug: cand.slug, nombre: cand.expected, count: 0, numReg: 0, sample: [] });
            }
          } catch { resolved = true; resolve({ slug: cand.slug, nombre: cand.expected, count: 0, numReg: 0, sample: [] }); }
        }
      };
      page.on('response', handler);
      page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      setTimeout(() => {
        if (!resolved) { resolved = true; page.off('response', handler); resolve({ slug: cand.slug, nombre: cand.expected, count: 0, numReg: 0, sample: [] }); }
      }, 8000);
    });

    if (result.count > 0) {
      console.log(`  ✅ ${result.numReg} productos`);
      console.log(`  Muestra:`);
      result.sample.forEach(p => {
        console.log(`    - Ref: ${p.ref} | ${p.marca} | ${p.fam1} > ${p.fam2} > ${p.fam3}`);
        console.log(`      ${p.desc}`);
      });
      realFamilies.push(result);
    } else {
      console.log(`  ❌ Sin productos`);
    }

    await sleep(1000);
  }

  await browser.close();

  // Save real families
  fs.writeFileSync('./sonepar-catalog-scraper/familias-reales-final.json', JSON.stringify(realFamilies, null, 2));
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📋 ${realFamilies.length} familias reales confirmadas:`);
  realFamilies.forEach(f => {
    console.log(`  ✅ "${f.slug}" → ${f.numReg.toLocaleString()} productos`);
  });
}

main().catch(console.error);
