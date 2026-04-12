/**
 * Encuentra TODOS los slugs reales de familias en tienda.sonepar.es
 */
import { chromium } from 'playwright';
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Slugs probados que FUNCIONAN:
// cables, distribucion-potencia, control-automatizacion-industrial, automatizacion-edificios, iluminacion

// Slugs que necesitamos encontrar:
// HVAC, Seguridad y Herramientas, Fontanería, Energías Renovables, Servicios

async function main() {
  console.log('🔍 Buscando slugs correctos para familias restantes...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Login y cookies
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(2000);
  try {
    for (const sel of ['button:has-text("ACEPTAR")', 'button:has-text("Aceptar")', '#onetrust-accept-btn-handler']) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); break; }
    }
  } catch {}
  await sleep(1000);

  // Familias restantes a probar con MUCHAS variantes
  const familiasRestantes = {
    'HVAC': [
      'climatizacion', 'hvac', 'hvac-y-climatizacion', 'climatizacion-hvac',
      'aire-acondicionado', 'ventilacion', 'calefaccion', 'termotecnia',
      'climatizacion-y-ventilacion', 'hvac-climatizacion', 'tratamiento-aire',
    ],
    'SEGURIDAD Y HERRAMIENTAS': [
      'seguridad', 'herramientas', 'seguridad-y-herramientas',
      'seguridad-industrial', 'herramientas-y-seguridad', 'equipos-proteccion',
      'epi', 'herramientas-manuales', 'herramientas-electricas',
      'instrumentos-medida', 'senalizacion', 'proteccion-individual',
      'seguridad-herramientas', 'seguridad-y-epi', 'herramientas-profesionales',
    ],
    'FONTANERIA': [
      'fontaneria', 'saneamiento', 'tuberias', 'fontaneria-y-gas',
      'instalacion-hidraulica', 'agua', 'hidraulica', 'griferia',
      'fontaneria-y-saneamiento', 'conduccion-aguas',
    ],
    'ENERGIAS RENOVABLES': [
      'energias-renovables', 'energia-solar', 'renovables', 'solar',
      'fotovoltaica', 'energia', 'eficiencia-energetica',
      'energias-renovables-y-eficiencia', 'generacion-distribuida',
      'autoconsumo', 'carga-vehiculo-electrico', 'movilidad-electrica',
    ],
    'SERVICIOS': [
      'servicios', 'logistica', 'servicios-logisticos', 'servicios-especiales',
      'consultoria', 'mantenimiento', 'instalacion', 'servicios-tecnicos',
    ],
  };

  const foundFamilies = [];

  for (const [familiaNombre, slugs] of Object.entries(familiasRestantes)) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📂 Familia: ${familiaNombre}`);
    console.log(`${'─'.repeat(60)}`);

    for (const slug of slugs) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${slug}?page=1`;
      process.stdout.write(`  ${slug.padEnd(45)} `);

      const result = await new Promise(resolve => {
        let resolved = false;
        const handler = async (response) => {
          if (!resolved && response.url().includes('LovArticulos') && response.status() === 200) {
            try {
              const json = await response.json();
              const count = json.dataRes?.length || 0;
              const numReg = json.numReg || 0;
              resolved = true;
              resolve({ slug, count, numReg });
            } catch { resolved = true; resolve({ slug, count: 0, numReg: 0 }); }
          }
        };
        page.on('response', handler);
        setTimeout(() => {
          if (!resolved) { resolved = true; page.off('response', handler); resolve({ slug, count: 0, numReg: 0 }); }
        }, 8000);
      });

      if (result.count > 0 || result.numReg > 0) {
        console.log(`✅ ${result.count} productos (total: ${result.numReg})`);
        foundFamilies.push({
          nombre: familiaNombre,
          slug: result.slug,
          productosPag1: result.count,
          totalEstimado: result.numReg
        });
      } else {
        console.log('❌');
      }

      await sleep(500);
    }
  }

  await browser.close();

  // Guardar resultados
  const allFamilies = [
    { nombre: 'CABLES', slug: 'cables' },
    { nombre: 'DISTRIBUCION DE POTENCIA', slug: 'distribucion-potencia' },
    { nombre: 'CONTROL Y AUTOMATIZACION INDUSTRIAL', slug: 'control-automatizacion-industrial' },
    { nombre: 'AUTOMATIZACION DE EDIFICIOS', slug: 'automatizacion-edificios' },
    { nombre: 'ILUMINACION', slug: 'iluminacion' },
    ...foundFamilies
  ];

  fs.writeFileSync('./sonepar-catalog-scraper/todas-las-familias.json', JSON.stringify(allFamilies, null, 2));

  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`📋 RESUMEN: ${allFamilies.length} familias encontradas`);
  allFamilies.forEach(f => {
    const total = f.totalEstimado || f.productosPag1 || '?';
    console.log(`  ✅ ${f.nombre.padEnd(40)} → slug: "${f.slug}" (pág1: ${f.productosPag1}, total: ${total})`);
  });

  // Las que NO se encontraron
  const foundSlugs = new Set(allFamilies.map(f => f.slug));
  const allTested = new Set([...slugs]);
  console.log(`\n💾 Guardado en todas-las-familias.json`);
}

main().catch(console.error);
