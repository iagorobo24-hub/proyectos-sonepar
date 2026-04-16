/**
 * Scraper Sonepar V11 — THE FINAL HARVESTER
 * Usa 1,169 combinaciones Familia+Marca para extraer el 100% del catálogo
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './sonepar-catalog-scraper';
const TASKS_FILE = path.join(OUTPUT_DIR, 'tareas-v11-final.json');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-v11-completo.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progreso-v11.json');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { taskIndex: 0, totalProducts: 0 };
}

function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

async function main() {
  console.log('🚀 Sonepar V11 — THE FINAL HARVESTER\n');

  const tasks = loadTasks();
  let progress = loadProgress();
  let allProducts = [];

  // Intentar cargar productos ya extraídos en esta sesión
  if (fs.existsSync(RESULT_FILE)) {
    try { 
      const data = fs.readFileSync(RESULT_FILE, 'utf8');
      if (data) allProducts = JSON.parse(data); 
    } catch (e) { console.log('⚠️ No se pudo cargar el archivo de resultados previo.'); }
  }

  console.log(`📊 Tareas totales: ${tasks.length}`);
  console.log(`📍 Empezando desde tarea: ${progress.taskIndex + 1}`);
  console.log(`📦 Productos acumulados: ${allProducts.length.toLocaleString()}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  let currentApiData = null;
  page.on('response', async response => {
    if (response.url().includes('LovArticulos') && response.status() === 200) {
      try { currentApiData = await response.json(); } catch (e) {}
    }
  });

  // Cookies
  await page.goto('https://tienda.sonepar.es/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  try {
    const btn = await page.$('button:has-text("ACEPTAR"), #onetrust-accept-btn-handler');
    if (btn) await btn.click();
  } catch (e) {}

  for (let i = progress.taskIndex; i < tasks.length; i++) {
    const task = tasks[i];
    const percentage = ((i / tasks.length) * 100).toFixed(1);
    console.log(`\n[${percentage}%] [${i + 1}/${tasks.length}] 📂 ${task.familiaNombre} | Marca: ${task.marca}`);
    
    let pageNum = 1;
    let retries = 0;

    while (pageNum <= 200) {
      const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${task.familiaSlug}?page=${pageNum}&marca=${encodeURIComponent(task.marca)}`;
      
      currentApiData = null;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      } catch (e) {
        if (retries < 2) {
          console.log(`   ⚠️ Timeout, reintentando...`);
          retries++;
          await sleep(3000);
          continue;
        }
        console.log(`   ❌ Saltando página ${pageNum} tras varios fallos.`);
        break;
      }

      await sleep(1000);

      if (!currentApiData || !currentApiData.dataRes || currentApiData.dataRes.length === 0) {
        break;
      }

      const mapped = currentApiData.dataRes.map(art => ({
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
      console.log(`      Pág ${pageNum}: +${mapped.length} productos`);

      if (currentApiData.dataRes.length < 20) break;
      pageNum++;
      retries = 0;
    }

    // Guardar progreso cada tarea
    progress.taskIndex = i + 1;
    progress.totalProducts = allProducts.length;
    saveProgress(progress);
    
    // Guardar resultados cada 5 tareas para no saturar el disco
    if (i % 5 === 0 || i === tasks.length - 1) {
      fs.writeFileSync(RESULT_FILE, JSON.stringify(allProducts, null, 2));
      console.log(`💾 Backup guardado. Total: ${allProducts.length.toLocaleString()}`);
    }
  }

  await browser.close();
  console.log('\n🎉 PROCESO V11 COMPLETADO');
}

main().catch(console.error);
