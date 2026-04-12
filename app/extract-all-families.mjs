import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Extrayendo TODAS las familias del sidebar...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('📍 Navegando a tienda.sonepar.es...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Accept cookies
  try {
    for (const sel of ['button:has-text("ACEPTAR")', 'button:has-text("Aceptar")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); console.log('✅ Cookies'); break; }
    }
  } catch {}
  await sleep(2000);

  // Navigate to catalog
  console.log('\n📂 Navegando al catálogo...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(6000);

  console.log('📋 Extrayendo enlaces de familia...\n');

  // Extract all links that look like family pages
  const allLinks = await page.evaluate(() => {
    const results = [];
    const allAnchors = document.querySelectorAll('a');
    allAnchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      if (href.includes('familia') && text.length > 2) {
        const slugMatch = href.match(/familia\/([^#?&"']+)/);
        if (slugMatch) {
          results.push({ slug: slugMatch[1], text });
        }
      }
    });
    const seen = new Set();
    return results.filter(f => {
      if (seen.has(f.slug)) return false;
      seen.add(f.slug);
      return true;
    });
  });

  console.log(`Encontrados ${allLinks.length} enlaces:\n`);
  allLinks.forEach((f, i) => console.log(`  ${i + 1}. ${f.text.padEnd(40)} → "${f.slug}"`));

  // Verify each family has products
  console.log('\n\n✅ Verificando productos...\n');
  const families = [];

  for (const fam of allLinks) {
    console.log(`Probando: ${fam.slug}...`);

    // Navigate to family
    await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${fam.slug}?page=1`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    }).catch(() => {});
    await sleep(3000);

    // Check API response
    const result = await new Promise(resolve => {
      let resolved = false;
      const handler = async (response) => {
        if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
          try {
            const json = await response.json();
            resolved = true;
            resolve({ slug: fam.slug, nombre: fam.text, count: json.dataRes?.length || 0, numReg: json.numReg || 0 });
          } catch { resolved = true; resolve({ slug: fam.slug, nombre: fam.text, count: 0, numReg: 0 }); }
        }
      };
      page.on('response', handler);
      // Trigger API call by reloading
      page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      setTimeout(() => {
        if (!resolved) { resolved = true; page.off('response', handler); resolve({ slug: fam.slug, nombre: fam.text, count: 0, numReg: 0 }); }
      }, 8000);
    });

    if (result.numReg > 0) {
      console.log(`  ✅ ${result.nombre}: ${result.numReg} productos`);
      families.push(result);
    } else {
      console.log(`  ❌ ${result.nombre}: sin productos`);
    }
    await sleep(1000);
  }

  fs.writeFileSync('./sonepar-catalog-scraper/familias-web.json', JSON.stringify(families, null, 2));

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📋 ${families.length} familias con productos:`);
  let totalAll = 0;
  families.forEach(f => {
    console.log(`  ✅ ${f.nombre.padEnd(40)} → "${f.slug}" (${f.numReg} productos)`);
    totalAll += f.numReg;
  });
  console.log(`\n  Total estimado: ${totalAll.toLocaleString()} productos`);
  console.log(`\n💾 Guardado en familias-web.json`);

  await browser.close();
}

main().catch(console.error);
