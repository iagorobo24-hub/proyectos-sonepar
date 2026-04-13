/**
 * Scraper Sonepar V12 — THE ULTIMATE HARVESTER
 * Captura el 100% del catálogo usando Family+Marca con interceptación garantizada
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './sonepar-catalog-scraper';
const TASKS_FILE = path.join(OUTPUT_DIR, 'tareas-v11-final.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-final-v12.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-v12.json');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch (e) {}
  }
  return { taskIndex: 0, totalProducts: 0 };
}

function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

async function main() {
  console.log('🚀 Sonepar V12 — THE ULTIMATE HARVESTER\n');

  const tasks = loadTasks();
  let progress = loadProgress();
  let allProducts = [];

  // Cargar lo que ya tengamos
  if (fs.existsSync(RESULT_FILE)) {
    try {
      const content = fs.readFileSync(RESULT_FILE, 'utf8');
      if (content) allProducts = JSON.parse(content);
      console.log(`📂 Cargados ${allProducts.length.toLocaleString()} productos previos.`);
    } catch (e) {
      console.log('⚠️ Creando nuevo archivo de resultados.');
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Aceptar cookies una vez
  console.log('📍 Inicializando sesión...');
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), #onetrust-accept-btn-handler');
    if (btn) { await btn.click(); console.log('✅ Cookies aceptadas'); }
  } catch (e) {}

  for (let i = progress.taskIndex; i < tasks.length; i++) {
    const task = tasks[i];
    const pct = ((i / tasks.length) * 100).toFixed(1);
    console.log(`\n[${pct}%] [${i + 1}/${tasks.length}] 📂 ${task.familiaNombre} | Marca: ${task.marca}`);
    
    let pageNum = 1;
    let emptyPages = 0;

    while (pageNum <= 205) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${task.familiaSlug}?page=${pageNum}&marca=${encodeURIComponent(task.marca)}`;
      
      console.log(`   📄 Pág ${pageNum}...`);
      
      try {
        // Promesa para esperar la respuesta de la API
        const responsePromise = page.waitForResponse(
          response => response.url().includes('LovArticulos') && response.status() === 200,
          { timeout: 20000 }
        );

        // Navegar
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Esperar la respuesta
        const response = await responsePromise;
        const json = await response.json();

        if (!json.dataRes || json.dataRes.length === 0) {
          console.log(`      🏁 Fin de resultados.`);
          break;
        }

        const mapped = json.dataRes.map(art => ({
          ref: art.refFabricante || art.codigoArticulo,
          refSonepar: art.codigoArticulo,
          nombre: art.nombre?.replace(/<[^>]*>/g, '').trim(),
          marca: art.marca || task.marca,
          familia: task.familiaNombre,
          precio: art.precio,
          pvp: art.pvp,
          stock: art.stock,
          pdf: art.urlPdfInfTecnica
        }));

        allProducts.push(...mapped);
        console.log(`      +${mapped.length} productos (Total task: ${mapped.length + (pageNum-1)*20})`);

        if (json.dataRes.length < 20) break;
        pageNum++;
        emptyPages = 0;

      } catch (e) {
        console.log(`   ⚠️ Error/Timeout: ${e.message.substring(0, 50)}`);
        // Si falla, intentamos recargar una vez
        try {
          await sleep(2000);
          await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
        } catch (re) {}
        emptyPages++;
        if (emptyPages > 2) break;
        pageNum++;
      }
      
      await sleep(500);
    }

    // Guardar progreso y datos cada tarea
    progress.taskIndex = i + 1;
    progress.totalProducts = allProducts.length;
    saveProgress(progress);
    
    // Guardar backup cada 3 tareas
    if (i % 3 === 0 || i === tasks.length - 1) {
      fs.writeFileSync(RESULT_FILE, JSON.stringify(allProducts, null, 2));
      console.log(`💾 Backup guardado: ${allProducts.length.toLocaleString()} refs`);
    }
  }

  await browser.close();
  console.log('\n🎉 PROCESO V12 COMPLETADO');
}

main().catch(console.error);
