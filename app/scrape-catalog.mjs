/**
 * Script para extraer el catálogo COMPLETO de Sonepar
 * Captura la respuesta de la API /wseportal/portal/catalogo directamente
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapeCatalog() {
  console.log('🚀 Extrayendo catálogo completo de Sonepar...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Interceptar TODAS las respuestas y guardar las del catálogo
  const catalogData = [];
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('wseportal/portal/catalogo') || url.includes('catalogo')) {
      try {
        const body = await response.json();
        catalogData.push({
          url,
          status: response.status(),
          data: body
        });
        console.log(`📡 Capturado: ${url} [${response.status()}] - ${JSON.stringify(body).length} bytes`);
      } catch (e) {}
    }
  });

  try {
    // ── Cargar la tienda ──
    console.log('📍 Cargando tienda.sonepar.es...');
    await page.goto('https://tienda.sonepar.es/tienda/#/home', { 
      waitUntil: 'domcontentloaded', timeout: 30000 
    });
    await sleep(5000);

    // Aceptar cookies
    try {
      const acceptBtn = await page.$('button:has-text("ACEPTAR"), button:has-text("Aceptar")');
      if (acceptBtn) {
        await acceptBtn.click();
        console.log('✅ Cookies aceptadas');
        await sleep(2000);
      }
    } catch (e) {}

    // ── Navegar a CATÁLOGO para disparar la carga de datos ──
    console.log('📍 Navegando a CATÁLOGO...');
    try {
      await page.click('text=Catálogo');
      await sleep(5000);
    } catch (e) {
      console.log('⚠️ No se pudo clickar Catálogo');
    }

    // ── Hacer scroll para cargar más datos ──
    console.log('📍 Haciendo scroll para cargar datos...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2000);

    // ── Intentar extraer datos directamente del DOM (la SPA los guarda en estado) ──
    console.log('📍 Extrayendo datos del estado de la aplicación...');
    
    const extractedData = await page.evaluate(() => {
      // Buscar en todas las propiedades del window y localStorage
      const data = {};
      
      // localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          const val = JSON.parse(localStorage.getItem(key));
          if (val && typeof val === 'object' && Object.keys(val).length > 1) {
            data[`localStorage_${key}`] = val;
          }
        } catch (e) {}
      }
      
      // sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try {
          const val = JSON.parse(sessionStorage.getItem(key));
          if (val && typeof val === 'object' && Object.keys(val).length > 1) {
            data[`sessionStorage_${key}`] = val;
          }
        } catch (e) {}
      }
      
      return data;
    });

    console.log(`📦 Keys encontradas en storage: ${Object.keys(extractedData).length}`);
    Object.keys(extractedData).forEach(key => {
      const size = JSON.stringify(extractedData[key]).length;
      console.log(`  - ${key}: ${size} bytes`);
    });

    // ── Guardar TODO ──
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'catalog-api-data.json'), 
      JSON.stringify(catalogData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'app-state-data.json'), 
      JSON.stringify(extractedData, null, 2)
    );

    // Screenshot final
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'fullpage.png'), fullPage: true });

    // ── Analizar la estructura del catálogo ──
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANÁLISIS DEL CATÁLOGO:');
    
    if (catalogData.length > 0 && catalogData[0].data) {
      const catalog = catalogData[0].data;
      if (catalog.dataRes && catalog.dataRes.familias) {
        console.log(`\n📂 Familias encontradas: ${catalog.dataRes.familias.length}`);
        catalog.dataRes.familias.forEach((fam, i) => {
          console.log(`  ${i + 1}. ${fam.nombre || fam.descripcion?.substring(0, 60) || 'sin nombre'}`);
          if (fam.subfamilias) {
            console.log(`     └─ ${fam.subfamilias.length} subfamilias`);
          }
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📁 Archivos generados en: ${OUTPUT_DIR}`);
    console.log(`  - catalog-api-data.json (${catalogData.length} respuestas)`);
    console.log(`  - app-state-data.json (${Object.keys(extractedData).length} keys)`);
    console.log(`  - screenshots/`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

scrapeCatalog().catch(console.error);
