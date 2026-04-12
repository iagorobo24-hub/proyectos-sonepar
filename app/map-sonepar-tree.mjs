import { chromium } from 'playwright';
import fs from 'fs';

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

async function mapTree() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  const tree = {};

  console.log('🚀 Iniciando mapeo jerárquico completo de Sonepar...\n');

  for (const familia of FAMILIAS) {
    process.stdout.write(`🔍 Procesando ${familia.nombre}... `);
    try {
      await page.goto(`https://tienda.sonepar.es/c/${familia.slug}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Intentar aceptar cookies rápido
      try { await page.click('#onetrust-accept-btn-handler', { timeout: 2000 }); } catch (e) {}

      // Esperar a que aparezcan los filtros (Facets)
      await page.waitForSelector('.facet-group', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const facets = Array.from(document.querySelectorAll('.facet-group'));
        // Buscamos específicamente el grupo de "Familia" o "Categoría"
        const catGroup = facets.find(f => {
          const title = f.querySelector('.facet-group-title')?.innerText || '';
          return title.toLowerCase().includes('familia') || title.toLowerCase().includes('categor');
        });

        if (!catGroup) return [];

        return Array.from(catGroup.querySelectorAll('.facet-item-label')).map(el => {
          // Limpiar nombre: "Cables de energía (1234)" -> "Cables de energía"
          return el.innerText.split('(')[0].trim();
        });
      });

      tree[familia.nombre] = data;
      console.log(`✅ (${data.length} subfamilias)`);
    } catch (e) {
      console.log(`⚠️  (Error: ${e.message.substring(0, 30)}...)`);
      tree[familia.nombre] = [];
    }
  }

  fs.writeFileSync('./sonepar-catalog-scraper/mapa-total.json', JSON.stringify(tree, null, 2));
  
  console.log('\n=============================================');
  console.log('✅ MAPA JERÁRQUICO GENERADO CON ÉXITO');
  console.log('📁 Ubicación: ./sonepar-catalog-scraper/mapa-total.json');
  console.log('=============================================\n');

  await browser.close();
}

mapTree().catch(console.error);
