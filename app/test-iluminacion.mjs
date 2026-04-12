import { chromium } from 'playwright';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  for (const sel of ['button:has-text("ACEPTAR")', '#onetrust-accept-btn-handler']) {
    const btn = await page.$(sel);
    if (btn) { await btn.click(); break; }
  }
  await sleep(1000);

  // Probar iluminacion que apareció en discover
  const slugs = ['iluminacion'];
  for (const slug of slugs) {
    console.log(`\n=== Probando: ${slug} ===`);
    let totalForFamily = 0;
    let pageNum = 1;
    
    while (pageNum <= 3) {
      const result = await new Promise(resolve => {
        let resolved = false;
        const handler = async (response) => {
          if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
            try {
              const json = await response.json();
              const count = json.dataRes?.length || 0;
              resolved = true;
              resolve({ count, numReg: json.numReg || 0 });
            } catch { resolved = true; resolve({ count: 0, numReg: 0 }); }
          }
        };
        page.on('response', handler);
        setTimeout(() => { if (!resolved) { resolved = true; page.off('response', handler); resolve({ count: 0, numReg: 0 }); } }, 10000);
      });

      if (result.count > 0) {
        console.log(`  Pág ${pageNum}: ${result.count} productos (total: ${result.numReg})`);
        totalForFamily += result.count;
        pageNum++;
      } else {
        console.log(`  Fin en pág ${pageNum}`);
        break;
      }
      await sleep(1000);
    }
    console.log(`  Total aproximado: ~${totalForFamily || 'desconocido'}`);
  }

  // Ahora explorar la web para ver qué familias existen realmente
  console.log('\n=== Explorando menú de familias ===');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(4000);

  const menuItems = await page.evaluate(() => {
    const items = [];
    // Buscar en sidebar
    const sidebarLinks = document.querySelectorAll('a');
    sidebarLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      if (href.includes('catalogo/familia') && text.length > 3) {
        items.push({ text, href });
      }
    });
    return items;
  });

  console.log(`Elementos encontrados: ${menuItems.length}`);
  menuItems.forEach(m => console.log(`  ${m.text} → ${m.href}`));

  // Si no hay items, intentar navegar directamente a varias URLs conocidas
  if (menuItems.length === 0) {
    console.log('\nProbando URLs directas...');
    const testUrls = [
      'https://tienda.sonepar.es/tienda/#/catalogo/familia/iluminacion?page=1',
      'https://tienda.sonepar.es/tienda/#/catalogo/familia/hvac-climatizacion?page=1',
      'https://tienda.sonepar.es/tienda/#/catalogo/familia/seguridad-y-herramientas?page=1',
    ];
    for (const url of testUrls) {
      console.log(`\n  Navegando: ${url.substring(url.indexOf('familia/'))}`);
      const result = await new Promise(resolve => {
        let resolved = false;
        const handler = async (response) => {
          if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
            try {
              const json = await response.json();
              resolved = true;
              resolve({ count: json.dataRes?.length || 0, numReg: json.numReg || 0 });
            } catch { resolved = true; resolve({ count: 0, numReg: 0 }); }
          }
        };
        page.on('response', handler);
        setTimeout(() => { if (!resolved) { resolved = true; page.off('response', handler); resolve({ count: 0, numReg: 0 }); } }, 10000);
      });
      console.log(`    ${result.count} productos, numReg: ${result.numReg}`);
      await sleep(1000);
    }
  }

  await browser.close();
}

main().catch(console.error);
