#!/usr/bin/env node
/**
 * SONEPAR CATALOG SCRAPER v3
 * ═══════════════════════════════════════════════════════════
 * Extrae el catálogo completo de tienda.sonepar.es usando Playwright.
 *
 * Estrategia:
 *   1. Login con credenciales de usuario Sonepar
 *   2. Navegar el árbol de categorías (Familia → Subfamilia → Tipo)
 *   3. Interceptar las peticiones XHR del buscador/API interna
 *   4. Extraer datos de producto: ref, nombre, marca, precios, docs, specs
 *   5. Guardar en JSON incremental (se puede reanudar)
 *
 * Uso:
 *   SONEPAR_USER=xxx SONEPAR_PASS=xxx node sonepar-scraper.mjs
 *   node sonepar-scraper.mjs --resume          # reanudar desde el último punto
 *   node sonepar-scraper.mjs --category CABLES  # solo una familia
 *
 * Requisitos:
 *   npm install playwright (o npx playwright install chromium)
 * ═══════════════════════════════════════════════════════════
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'scrape-progress.json');
const PRODUCTS_FILE = path.join(OUTPUT_DIR, 'catalogo-sonepar.json');
const LOG_FILE = path.join(OUTPUT_DIR, 'scrape.log');

const BASE_URL = 'https://tienda.sonepar.es';
const SEARCH_URL = `${BASE_URL}/tienda/es/search`;

// ── Config ─────────────────────────────────────────────────
const CONFIG = {
  headless: process.env.HEADLESS !== 'false',
  timeout: 30_000,
  pageSize: 48,
  maxRetries: 3,
  delayBetweenPages: 1500,    // ms entre páginas (rate limit)
  delayBetweenCategories: 3000,
  maxProductsPerCategory: 10_000,
  resume: process.argv.includes('--resume'),
  onlyCategory: getArgValue('--category'),
};

// ── CLI helpers ────────────────────────────────────────────
function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

// ── Logger ─────────────────────────────────────────────────
function log(level, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Categorías de Sonepar ──────────────────────────────────
// Las 10 familias principales del catálogo
const FAMILIAS = [
  { name: 'CABLES', searchTerms: ['cable', 'conductor', 'manguera', 'fibra optica'] },
  { name: 'DISTRIBUCION DE POTENCIA', searchTerms: ['interruptor automatico', 'diferencial', 'magnetotermico', 'cuadro electrico', 'embarrado'] },
  { name: 'CONTROL Y AUTOMATIZACION INDUSTRIAL', searchTerms: ['contactor', 'variador', 'guardamotor', 'PLC', 'sensor inductivo', 'rele'] },
  { name: 'AUTOMATIZACION DE EDIFICIOS', searchTerms: ['KNX', 'domotica', 'videoportero', 'mecanismo electrico', 'interruptor conmutador'] },
  { name: 'ILUMINACION', searchTerms: ['luminaria', 'downlight', 'panel LED', 'proyector', 'regleta LED', 'emergencia'] },
  { name: 'HVAC', searchTerms: ['aire acondicionado', 'caldera', 'termostato', 'ventilacion', 'split'] },
  { name: 'SEGURIDAD Y HERRAMIENTAS', searchTerms: ['herramienta', 'multimetro', 'EPI', 'guantes aislantes', 'detector'] },
  { name: 'FONTANERIA', searchTerms: ['tubo multicapa', 'grifo', 'valvula', 'sanitario', 'cisterna'] },
  { name: 'ENERGIAS RENOVABLES', searchTerms: ['panel solar', 'inversor solar', 'bateria litio', 'cargador vehiculo', 'wallbox'] },
  { name: 'SERVICIOS', searchTerms: ['bobina', 'palet', 'porte'] },
];

// ── Estado ─────────────────────────────────────────────────
let progress = {
  startedAt: null,
  completedCategories: [],
  currentCategory: null,
  currentPage: 0,
  totalProducts: 0,
  errors: 0,
};

let allProducts = [];
let seenRefs = new Set();

// ── Main ───────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Cargar progreso previo si --resume
  if (CONFIG.resume && fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    log('info', `Reanudando scrape — ${progress.totalProducts} productos previos`);
  }
  if (fs.existsSync(PRODUCTS_FILE) && CONFIG.resume) {
    allProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    seenRefs = new Set(allProducts.map(p => p.ref));
    log('info', `Cargados ${allProducts.length} productos del archivo previo`);
  }

  progress.startedAt = progress.startedAt || new Date().toISOString();

  // Credenciales
  const user = process.env.SONEPAR_USER;
  const pass = process.env.SONEPAR_PASS;
  if (!user || !pass) {
    log('error', 'Necesitas SONEPAR_USER y SONEPAR_PASS como variables de entorno');
    log('info', 'Uso: SONEPAR_USER=email SONEPAR_PASS=password node sonepar-scraper.mjs');
    process.exit(1);
  }

  log('info', '=== SONEPAR CATALOG SCRAPER v3 ===');
  log('info', `Headless: ${CONFIG.headless}`);
  log('info', `Resume: ${CONFIG.resume}`);
  if (CONFIG.onlyCategory) log('info', `Solo categoría: ${CONFIG.onlyCategory}`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1920, height: 1080 },
  });

  // Interceptar respuestas de la API de búsqueda
  const interceptedProducts = [];
  context.on('response', async (response) => {
    const url = response.url();
    // Interceptar respuestas de la API de productos/búsqueda
    if (
      (url.includes('/api/') || url.includes('/search') || url.includes('/products')) &&
      response.status() === 200
    ) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const json = await response.json();
          if (json.products || json.results || json.items || json.data) {
            const items = json.products || json.results || json.items || json.data;
            if (Array.isArray(items)) {
              interceptedProducts.push(...items);
            }
          }
        }
      } catch {
        // Ignorar errores de parseo
      }
    }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.timeout);

  try {
    // ── Paso 1: Login ──
    log('info', 'Iniciando login...');
    await login(page, user, pass);
    log('info', 'Login exitoso');

    // ── Paso 2: Scrape por familias ──
    const familias = CONFIG.onlyCategory
      ? FAMILIAS.filter(f => f.name.includes(CONFIG.onlyCategory.toUpperCase()))
      : FAMILIAS;

    for (const familia of familias) {
      if (progress.completedCategories.includes(familia.name)) {
        log('info', `⏭️  ${familia.name} ya completada, saltando`);
        continue;
      }

      log('info', `\n${'═'.repeat(60)}`);
      log('info', `📂 FAMILIA: ${familia.name}`);
      log('info', `${'═'.repeat(60)}`);
      progress.currentCategory = familia.name;

      await scrapeFamilia(page, familia, interceptedProducts);

      progress.completedCategories.push(familia.name);
      progress.currentCategory = null;
      saveProgress();
      saveProducts();

      await delay(CONFIG.delayBetweenCategories);
    }

    log('info', '\n🎉 SCRAPING COMPLETADO');
    log('info', `Total productos: ${allProducts.length}`);
    log('info', `Errores: ${progress.errors}`);
    log('info', `Archivo: ${PRODUCTS_FILE}`);

  } catch (err) {
    log('error', `Error fatal: ${err.message}`);
    log('error', err.stack);
  } finally {
    saveProducts();
    saveProgress();
    await browser.close();
  }
}

// ── Login ──────────────────────────────────────────────────
async function login(page, user, pass) {
  await page.goto(`${BASE_URL}/tienda/es/login`, { waitUntil: 'networkidle' });
  await delay(2000);

  // Aceptar cookies si aparece el banner
  try {
    const cookieBtn = page.locator('button:has-text("Aceptar"), #onetrust-accept-btn-handler, .cookie-accept');
    if (await cookieBtn.isVisible({ timeout: 3000 })) {
      await cookieBtn.click();
      await delay(1000);
    }
  } catch {
    // No hay banner de cookies
  }

  // Rellenar formulario de login
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="j_username"], #username, #email');
  const passInput = page.locator('input[type="password"], input[name="password"], input[name="j_password"], #password');
  const submitBtn = page.locator('button[type="submit"], input[type="submit"], .login-btn, button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")');

  await emailInput.first().fill(user);
  await passInput.first().fill(pass);
  await submitBtn.first().click();

  // Esperar redirección post-login
  await page.waitForURL(url => !url.toString().includes('login'), { timeout: 15_000 });
  await delay(2000);
  log('info', `Página post-login: ${page.url()}`);
}

// ── Scrape de una familia ──────────────────────────────────
async function scrapeFamilia(page, familia, interceptedProducts) {
  let familyProductCount = 0;

  for (const searchTerm of familia.searchTerms) {
    log('info', `  🔍 Buscando: "${searchTerm}"`);

    let currentPage = 1;
    let hasMore = true;

    while (hasMore && familyProductCount < CONFIG.maxProductsPerCategory) {
      try {
        // Limpiar interceptados antes de la petición
        interceptedProducts.length = 0;

        const url = `${SEARCH_URL}?q=${encodeURIComponent(searchTerm)}&page=${currentPage}&pageSize=${CONFIG.pageSize}`;
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await delay(2000);

        // Intentar extraer productos del DOM
        const products = await extractProductsFromPage(page);

        // Combinar con los interceptados via XHR
        const intercepted = [...interceptedProducts];
        interceptedProducts.length = 0;

        // Procesar productos del DOM
        let newCount = 0;
        for (const product of products) {
          if (product.ref && !seenRefs.has(product.ref)) {
            seenRefs.add(product.ref);
            allProducts.push({
              ...product,
              familia: familia.name,
              scrapedAt: new Date().toISOString(),
            });
            newCount++;
            familyProductCount++;
          }
        }

        // Procesar interceptados
        for (const item of intercepted) {
          const mapped = mapInterceptedProduct(item, familia.name);
          if (mapped && mapped.ref && !seenRefs.has(mapped.ref)) {
            seenRefs.add(mapped.ref);
            allProducts.push(mapped);
            newCount++;
            familyProductCount++;
          }
        }

        progress.totalProducts = allProducts.length;
        log('info', `    Página ${currentPage}: ${products.length} DOM + ${intercepted.length} XHR → ${newCount} nuevos (total: ${allProducts.length})`);

        // Comprobar si hay más páginas
        hasMore = products.length >= CONFIG.pageSize || await hasNextPage(page);
        currentPage++;

        // Guardar progreso periódico
        if (allProducts.length % 500 === 0) {
          saveProducts();
          saveProgress();
        }

        await delay(CONFIG.delayBetweenPages);

      } catch (err) {
        progress.errors++;
        log('error', `    Error en página ${currentPage}: ${err.message}`);

        if (progress.errors > 50) {
          log('error', 'Demasiados errores, deteniendo...');
          return;
        }
        await delay(5000);
        currentPage++;
      }
    }
  }

  log('info', `  ✅ ${familia.name}: ${familyProductCount} productos`);
}

// ── Extracción del DOM ─────────────────────────────────────
async function extractProductsFromPage(page) {
  return page.evaluate(() => {
    const products = [];

    // Selectores genéricos para tiendas de e-commerce Sonepar
    const productCards = document.querySelectorAll(
      '.product-card, .product-item, .product-tile, ' +
      '[data-product], [class*="product-list"] > *, ' +
      '.search-result-item, .result-item, ' +
      'article[class*="product"], div[class*="ProductCard"], ' +
      '.c-product-tile, .js-product-tile'
    );

    for (const card of productCards) {
      try {
        // Intentar extraer datos de atributos data-*
        const dataProduct = card.dataset.product;
        let productData = null;
        if (dataProduct) {
          try { productData = JSON.parse(dataProduct); } catch {}
        }

        // Extraer referencia
        const ref = productData?.sku
          || productData?.code
          || productData?.reference
          || card.querySelector('[class*="ref"], [class*="sku"], [data-ref], [data-sku]')?.textContent?.trim()
          || card.querySelector('.product-code, .product-ref, .product-sku')?.textContent?.trim()
          || '';

        // Extraer nombre
        const name = productData?.name
          || card.querySelector('h2, h3, h4, .product-name, .product-title, [class*="name"], [class*="title"]')?.textContent?.trim()
          || '';

        // Extraer marca
        const brand = productData?.brand
          || card.querySelector('.product-brand, [class*="brand"], [class*="marca"]')?.textContent?.trim()
          || '';

        // Extraer precios
        const priceEl = card.querySelector('.product-price, [class*="price"], [class*="precio"]');
        const priceText = priceEl?.textContent?.trim() || '';
        const priceMatch = priceText.match(/([\d.,]+)\s*€/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

        // PVP / precio tarifa
        const pvpEl = card.querySelector('.product-pvp, [class*="pvp"], [class*="tarifa"], .original-price, .old-price, del');
        const pvpText = pvpEl?.textContent?.trim() || '';
        const pvpMatch = pvpText.match(/([\d.,]+)\s*€/);
        const pvp = pvpMatch ? parseFloat(pvpMatch[1].replace(',', '.')) : price;

        // Extraer imagen
        const imgEl = card.querySelector('img');
        const imageUrl = imgEl?.src || imgEl?.dataset?.src || '';

        // Extraer ref Sonepar
        const refSonepar = productData?.sonepar_id
          || card.querySelector('[class*="sonepar"], [data-sonepar]')?.textContent?.trim()
          || '';

        // Extraer enlace
        const linkEl = card.querySelector('a[href*="product"], a[href*="producto"]');
        const productUrl = linkEl?.href || '';

        // Extraer stock/disponibilidad
        const stockEl = card.querySelector('[class*="stock"], [class*="dispo"], [class*="availab"]');
        const stockText = stockEl?.textContent?.trim()?.toLowerCase() || '';
        const inStock = stockText.includes('disponible') || stockText.includes('stock') || stockText.includes('available');

        // Extraer unidad
        const unitEl = card.querySelector('[class*="unit"], [class*="unidad"]');
        const unit = unitEl?.textContent?.trim() || 'ud';

        if (ref || name) {
          products.push({
            ref: ref.replace(/\s+/g, '').toUpperCase(),
            refSonepar: refSonepar.replace(/\s+/g, ''),
            nombre: name,
            marca: brand.toUpperCase(),
            precio: price,
            pvp: pvp,
            imageUrl: imageUrl,
            productUrl: productUrl,
            inStock: inStock,
            unit: unit,
          });
        }
      } catch {
        // Ignorar errores de extracción individual
      }
    }

    return products;
  });
}

// ── Mapear producto interceptado via XHR ───────────────────
function mapInterceptedProduct(item, familia) {
  if (!item) return null;

  const ref = (item.sku || item.code || item.reference || item.ref || item.articleNumber || '').toString().trim().toUpperCase();
  if (!ref) return null;

  return {
    ref,
    refSonepar: (item.sonepar_id || item.sonepar_ref || item.sonaparId || '').toString(),
    nombre: item.name || item.title || item.description || '',
    marca: (item.brand || item.manufacturer || item.brandName || '').toUpperCase(),
    familia,
    precio: parseFloat(item.price || item.netPrice || item.priceNet || 0),
    pvp: parseFloat(item.pvp || item.listPrice || item.grossPrice || item.priceGross || 0),
    imageUrl: item.imageUrl || item.image || item.thumbnail || '',
    productUrl: item.url || item.productUrl || '',
    inStock: item.inStock ?? item.available ?? item.stock > 0,
    unit: item.unit || item.salesUnit || 'ud',
    ean: item.ean || item.gtin || '',
    documents: extractDocuments(item),
    specifications: extractSpecifications(item),
    scrapedAt: new Date().toISOString(),
  };
}

function extractDocuments(item) {
  const docs = [];
  const docSources = item.documents || item.docs || item.attachments || item.downloads || [];

  for (const d of docSources) {
    if (typeof d === 'string') {
      docs.push({ name: 'Documento', url: d, type: 'ficha_tecnica' });
    } else if (d.url || d.href || d.link) {
      docs.push({
        name: d.name || d.title || d.label || 'Documento',
        url: d.url || d.href || d.link,
        type: classifyDocType(d.name || d.title || ''),
        format: (d.format || d.mimeType || '').replace('application/', ''),
      });
    }
  }

  // PDF directo
  if (item.pdf || item.pdfUrl || item.datasheet) {
    docs.push({
      name: 'Ficha técnica',
      url: item.pdf || item.pdfUrl || item.datasheet,
      type: 'ficha_tecnica',
      format: 'pdf',
    });
  }

  return docs;
}

function classifyDocType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('ficha') || n.includes('datasheet') || n.includes('hoja de datos')) return 'ficha_tecnica';
  if (n.includes('manual') || n.includes('instruc')) return 'manual';
  if (n.includes('certificado') || n.includes('certif')) return 'certificado';
  if (n.includes('declaración') || n.includes('conformidad') || n.includes('CE')) return 'declaracion_ce';
  if (n.includes('esquema') || n.includes('CAD') || n.includes('DWG')) return 'esquema';
  if (n.includes('catálogo') || n.includes('catalog')) return 'catalogo';
  return 'hoja_datos';
}

function extractSpecifications(item) {
  const specs = [];
  const specSources = item.specifications || item.specs || item.attributes || item.features || {};

  if (Array.isArray(specSources)) {
    for (const s of specSources) {
      if (s.key && s.value) {
        specs.push({
          key: s.key || s.name || s.label,
          value: s.value,
          unit: s.unit || '',
          group: s.group || s.category || 'General',
        });
      }
    }
  } else if (typeof specSources === 'object') {
    for (const [key, value] of Object.entries(specSources)) {
      if (value !== null && value !== undefined) {
        specs.push({ key, value: String(value), unit: '', group: 'General' });
      }
    }
  }

  return specs;
}

// ── Paginación ─────────────────────────────────────────────
async function hasNextPage(page) {
  try {
    return page.evaluate(() => {
      const next = document.querySelector(
        'a[rel="next"], .pagination .next:not(.disabled), ' +
        'button[aria-label*="siguiente"], button[aria-label*="next"], ' +
        '.pagination-next:not(.disabled), [class*="next-page"]:not(.disabled)'
      );
      return !!next;
    });
  } catch {
    return false;
  }
}

// ── Utilidades ─────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveProducts() {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(allProducts, null, 2));
}

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ── Ejecutar ───────────────────────────────────────────────
main().catch(err => {
  log('error', `Error fatal no capturado: ${err.message}`);
  process.exit(1);
});
