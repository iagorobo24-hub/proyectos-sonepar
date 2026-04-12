/**
 * Diagnóstico de API Sonepar - Captura TODOS los campos disponibles
 */
import { chromium } from 'playwright';
import fs from 'fs';

const OUTPUT_FILE = './sonepar-catalog-scraper/api-diagnostic.json';
fs.mkdirSync('./sonepar-catalog-scraper', { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 Diagnóstico API Sonepar - Capturando todos los campos...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Capturar TODAS las responses de LovArticulos
  const capturedResponses = [];
  page.on('response', async response => {
    if (response.url().includes('LovArticulos') && response.status() === 200) {
      try {
        const json = await response.json();
        capturedResponses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          dataStructure: json
        });
        console.log(`📡 Interceptada: ${response.url().substring(0, 120)}...`);
      } catch {}
    }
  });

  // Navegar
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

  // Ir a una familia conocida que funciona
  console.log('📂 Navegando a DISTRIBUCION DE POTENCIA...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo/familia/distribucion-potencia?page=1', { 
    waitUntil: 'networkidle', 
    timeout: 20000 
  }).catch(() => {});
  await sleep(5000);

  // Navegar a otra familia diferente
  console.log('📂 Navegando a CONTROL Y AUTOMATIZACION...');
  await page.goto('https://tienda.sonepar.es/tienda/#/catalogo/familia/control-automatizacion-industrial?page=1', { 
    waitUntil: 'networkidle', 
    timeout: 20000 
  }).catch(() => {});
  await sleep(5000);

  await browser.close();

  if (capturedResponses.length === 0) {
    console.log('❌ No se capturó ninguna respuesta de API');
    console.log('💡 Intenta hacerlo manualmente: navega a tienda.sonepar.es, abre DevTools > Network > XHR y recarga');
    process.exit(1);
  }

  // Analizar estructura del primer artículo del primer response
  const firstResponse = capturedResponses[0];
  const dataRes = firstResponse.dataStructure.dataRes || [];
  const firstArticle = dataRes[0] || {};

  // Extraer TODOS los campos del artículo
  const allFields = Object.keys(firstArticle);
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 RESPUESTA API: ${capturedResponses.length} responses capturadas`);
  console.log(`📦 Artículos por página: ${dataRes.length}`);
  console.log(`${'═'.repeat(70)}`);

  console.log('\n📋 CAMPOS DISPONIBLES EN CADA ARTÍCULO:');
  console.log(`${'─'.repeat(70)}`);
  
  // Analizar varios artículos para campos que pueden variar
  const allFieldNames = new Set();
  for (const art of dataRes.slice(0, 10)) {
    Object.keys(art).forEach(k => allFieldNames.add(k));
  }

  for (const field of [...allFieldNames].sort()) {
    const values = dataRes.slice(0, 5).map(art => {
      const val = art[field];
      if (val === undefined || val === null) return null;
      if (typeof val === 'object') return JSON.stringify(val).substring(0, 80);
      return String(val).substring(0, 80);
    }).filter(v => v !== null);

    const type = typeof firstArticle[field];
    const sample = values[0] || '(vacío)';
    const hasData = values.length > 0 ? `✅ ${values.length}/5` : '❌ 0/5';

    console.log(`  ${hasData}  ${field}`);
    console.log(`       tipo: ${type}  |  ejemplo: ${sample}`);
  }

  // Guardar el primer artículo completo + estructura del response
  const diagnostic = {
    summary: {
      totalResponses: capturedResponses.length,
      articlesPerPage: dataRes.length,
      totalFields: allFields.size,
      fields: [...allFieldNames].sort()
    },
    firstArticleComplete: firstArticle,
    sampleArticles: dataRes.slice(0, 3),
    responseStructure: {
      topLevelKeys: Object.keys(firstResponse.dataStructure),
      dataResLength: dataRes.length,
      hasPagination: 'pagina' in firstResponse.dataStructure,
      paginationFields: Object.keys(firstResponse.dataStructure).filter(k => 
        k.toLowerCase().includes('pag') || k.toLowerCase().includes('total') || k.toLowerCase().includes('count')
      )
    }
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(diagnostic, null, 2));
  console.log(`\n💾 Diagnóstico completo guardado: ${OUTPUT_FILE}`);
  console.log(`   Tamaño: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);

  console.log('\n📋 ESTRUCTURA DE PAGINACIÓN DEL RESPONSE:');
  console.log(`${'─'.repeat(70)}`);
  const resp = firstResponse.dataStructure;
  for (const key of Object.keys(resp).sort()) {
    const val = resp[key];
    if (typeof val !== 'object' || Array.isArray(val) && key !== 'dataRes') {
      console.log(`  ${key}: ${val}`);
    } else if (key === 'dataRes') {
      console.log(`  ${key}: [array de ${val.length} artículos]`);
    }
  }
}

main().catch(console.error);
