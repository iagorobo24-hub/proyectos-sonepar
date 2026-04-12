import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Buscando slugs correctos para HVAC y Energías Renovables...\n');

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

  // Try many more slugs for HVAC and Renovables
  const testSlugs = [
    // HVAC / Climatización
    'climatizacion-y-ventilacion', 'hvac-y-climatizacion', 'ventilacion', 'aire-acondicionado-y-ventilacion',
    'tratamiento-aire', 'termotecnia', 'clima', 'climatizacion', 'calefaccion', 'refrigeracion',
    // Energías Renovables  
    'energias-renovables-y-vehiculo-electrico', 'energia-y-renovables', 'generacion-distribuida',
    'eficiencia-energetica', 'carga-vehiculo-electrico', 'movilidad-electrica', 've', 'renovable',
    'solar-y-eolica', 'autoconsumo', 'baterias', 'inversores',
    // Iluminación
    'iluminacion', 'iluminacion-led', 'led', 'alumbrado', 'iluminacion-industrial',
    // Control y Autom. Industrial
    'control-y-automatizacion', 'automatizacion', 'control', 'automatismos',
  ];

  const realFamilies = [];

  for (const slug of testSlugs) {
    process.stdout.write(`  ${slug.padEnd(50)} `);

    await page.goto(`https://tienda.sonepar.es/tienda/#/catalogo/familia/${slug}?page=1`, {
      waitUntil: 'domcontentloaded', timeout: 8000
    }).catch(() => {});
    await sleep(2000);

    const result = await new Promise(resolve => {
      let resolved = false;
      const handler = async (response) => {
        if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
          try {
            const json = await response.json();
            const products = json.dataRes || [];
            if (products.length > 0) {
              const fam1 = products[0]?.descFam1 || '';
              const fam2 = products[0]?.descFam2 || '';
              resolved = true;
              resolve({ slug, count: products.length, numReg: json.numReg || 0, fam1, fam2 });
            } else {
              resolved = true;
              resolve({ slug, count: 0, numReg: 0, fam1: '', fam2: '' });
            }
          } catch { resolved = true; resolve({ slug, count: 0, numReg: 0, fam1: '', fam2: '' }); }
        }
      };
      page.on('response', handler);
      page.reload({ waitUntil: 'domcontentloaded', timeout: 6000 }).catch(() => {});
      setTimeout(() => {
        if (!resolved) { resolved = true; page.off('response', handler); resolve({ slug, count: 0, numReg: 0, fam1: '', fam2: '' }); }
      }, 8000);
    });

    if (result.numReg > 0) {
      console.log(`✅ ${result.numReg.toLocaleString()} | ${result.fam1} > ${result.fam2}`);
      realFamilies.push(result);
    } else {
      console.log('❌');
    }
    await sleep(500);
  }

  await browser.close();

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📋 Familias encontradas:`);
  realFamilies.forEach(f => {
    console.log(`  ✅ "${f.slug}" → ${f.numReg.toLocaleString()} productos (${f.fam1} > ${f.fam2})`);
  });

  // Merge with previous results
  const prev = fs.existsSync('./sonepar-catalog-scraper/familias-reales-final.json')
    ? JSON.parse(fs.readFileSync('./sonepar-catalog-scraper/familias-reales-final.json', 'utf8')) : [];

  const all = [...prev];
  for (const f of realFamilies) {
    if (!all.find(e => e.slug === f.slug)) {
      all.push({ slug: f.slug, nombre: f.fam1, numReg: f.numReg, fam1: f.fam1, fam2: f.fam2 });
    }
  }

  fs.writeFileSync('./sonepar-catalog-scraper/todas-familias-confirmadas.json', JSON.stringify(all, null, 2));
  console.log(`\n💾 Guardado: todas-familias-confirmadas.json (${all.length} familias)`);
}

main().catch(console.error);
