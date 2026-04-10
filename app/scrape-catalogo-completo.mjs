/**
 * Scraper completo del catálogo Sonepar
 * Extrae TODOS los productos categoría por categoría
 * Formato: JSON compatible con catalogoSonepar.js
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'catalogo-completo.json');

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Mapa de categorías y sus subfamilias (basado en estructura real de Sonepar)
const CATEGORIAS = [
  {
    nombre: 'Cables',
    codigo: 'S01',
    familias: [
      { id: 'F_1.1', nombre: 'Cables de Baja Tensión', subfamilias: [
        { id: '01010001', nombre: 'Cables de Energía 500/750 V PVC' },
        { id: '01010002', nombre: 'Cables de Energía 500/750 V Libre Halógenos' },
        { id: '01010003', nombre: 'Cables de Energía H03V-H05V/K' },
        { id: '01010004', nombre: 'Cables de Energía 0,6/1KV RV/RZ1' },
        { id: '01010005', nombre: 'Cables RZ1-K Libre Halógenos' },
        { id: '01010006', nombre: 'Cables RZ1-K (AS+) SZ1-K (AS+)' },
        { id: '01010012', nombre: 'Cable Flexible de Goma' },
        { id: '01010013', nombre: 'Cable Solar H1Z2Z2-K' },
      ]},
      { id: 'F_1.2', nombre: 'Cables de Datos', subfamilias: [
        { id: '01020001', nombre: 'Cableado Red Cobre' },
        { id: '01020002', nombre: 'Cableado Seguridad y Comunicaciones' },
        { id: '01020101', nombre: 'Cableado Fibra Óptica' },
      ]},
    ]
  },
  {
    nombre: 'Distribución de Potencia',
    codigo: 'S02',
    familias: [
      { id: 'F_2.1', nombre: 'Gestión de Cableado', subfamilias: [
        { id: '02010101', nombre: 'Canal de PVC' },
        { id: '02010201', nombre: 'Bandejas y Rejillas' },
        { id: '02010305', nombre: 'Tubo de Instalación Metálico' },
        { id: '02010401', nombre: 'Puestos de Trabajo' },
      ]},
      { id: 'F_2.2', nombre: 'Envolventes y Cuadros', subfamilias: [
        { id: '02020101', nombre: 'Cajas de Conexión' },
        { id: '02020102', nombre: 'Envolvente Vacío' },
        { id: '02020103', nombre: 'Sistemas de Envolvente' },
      ]},
      { id: 'F_2.3', nombre: 'Distribución Baja Tensión', subfamilias: [
        { id: '02030101', nombre: 'Aparamenta Modular' },
        { id: '02030102', nombre: 'Aparamenta Caja Moldeada' },
      ]},
    ]
  },
  {
    nombre: 'Control y Automatización Industrial',
    codigo: 'S06',
    familias: [
      { id: 'F_6.2', nombre: 'Automatización y Control', subfamilias: [
        { id: '06020101', nombre: 'Interfaz Hombre Máquina - HMI' },
        { id: '06020102', nombre: 'Autómatas - PLCs' },
        { id: '06020103', nombre: 'Relé Lógico Programable' },
        { id: '06020104', nombre: 'Comunicaciones Industriales' },
        { id: '06020105', nombre: 'Fuentes de Alimentación Industriales' },
      ]},
      { id: 'F_6.3', nombre: 'Dispositivos de Control Auxiliar', subfamilias: [
        { id: '06030101', nombre: 'Mando y Señalización para Cuadros' },
        { id: '06030102', nombre: 'Interruptor / Conmutador de Levas' },
        { id: '06030103', nombre: 'Balizas Señalización' },
      ]},
      { id: 'F_6.4', nombre: 'Relés e Interfaces', subfamilias: [
        { id: '06040101', nombre: 'Contactor Industrial' },
        { id: '06040102', nombre: 'Relés Interfaz' },
        { id: '06040103', nombre: 'Relés de Control y Supervisión' },
      ]},
      { id: 'F_6.5', nombre: 'Control de Velocidad y Accionamientos', subfamilias: [
        { id: '06050101', nombre: 'Variadores de Frecuencia' },
        { id: '06050102', nombre: 'Control de Posición' },
        { id: '06050103', nombre: 'Motores y Motorreductores' },
        { id: '06050104', nombre: 'Protección Motor' },
        { id: '06050105', nombre: 'Arrancadores Motor' },
      ]},
      { id: 'F_6.6', nombre: 'Detección Industrial', subfamilias: [
        { id: '06060101', nombre: 'Sensórica de Detección/Medición/Encoders' },
        { id: '06060102', nombre: 'Instrumentación de Presión' },
        { id: '06060103', nombre: 'Instrumentación de Temperatura' },
        { id: '06060104', nombre: 'Equipos de Medida y Control' },
      ]},
    ]
  },
  {
    nombre: 'Automatización de Edificios',
    codigo: 'S04',
    familias: [
      { id: 'F_4.1', nombre: 'Gestión Energética', subfamilias: [
        { id: '04010101', nombre: 'Medida de Energía' },
      ]},
      { id: 'F_4.3', nombre: 'Seguridad', subfamilias: [
        { id: '04030301', nombre: 'Control de Accesos' },
        { id: '04030302', nombre: 'Sistemas Intrusión' },
        { id: '04030303', nombre: 'Sistemas de Sonido y Evacuación' },
      ]},
    ]
  },
  {
    nombre: 'Iluminación',
    codigo: 'S05',
    familias: [
      { id: 'F_5.1', nombre: 'Dispositivos de Iluminación', subfamilias: [
        { id: '05010001', nombre: 'Luminarias Interior Funcional' },
        { id: '05010002', nombre: 'Luminarias Interior Decorativa' },
        { id: '05010003', nombre: 'Tiras de LED' },
        { id: '05010101', nombre: 'Luminarias Alumbrado Público' },
        { id: '05010102', nombre: 'Luminarias Exterior Arquitectónico' },
        { id: '05010201', nombre: 'Luminarias Interior Industrial' },
        { id: '05010300', nombre: 'Iluminación de Emergencia' },
      ]},
      { id: 'F_5.2', nombre: 'Accesorios y Gestión', subfamilias: [
        { id: '05020001', nombre: 'Reguladores de Iluminación' },
        { id: '05020002', nombre: 'Detectores de Movimiento y Presencia' },
        { id: '05020004', nombre: 'Fuentes de Alimentación/Drivers' },
      ]},
      { id: 'F_5.3', nombre: 'Lámparas', subfamilias: [
        { id: '05030101', nombre: 'Lámparas LED/Multi-LED' },
        { id: '05030102', nombre: 'Módulos LED' },
      ]},
    ]
  },
  {
    nombre: 'HVAC - Climatización',
    codigo: 'S06',
    familias: [
      { id: 'F_6.1', nombre: 'Tecnología Eléctrica', subfamilias: [
        { id: '06010000', nombre: 'Calefacción Eléctrica' },
        { id: '06010101', nombre: 'Producción ACS' },
        { id: '06010201', nombre: 'Ventilación Doméstica' },
        { id: '06010204', nombre: 'Ventilación Industrial' },
        { id: '06010208', nombre: 'Difusión' },
        { id: '06010301', nombre: 'AA Doméstico' },
        { id: '06010302', nombre: 'Gama Comercial' },
        { id: '06010303', nombre: 'AA Industrial' },
        { id: '06010400', nombre: 'Aerotermia y Bombas de Calor' },
        { id: '06010501', nombre: 'Recuperadores de Calor' },
      ]},
    ]
  },
  {
    nombre: 'Seguridad y Herramientas',
    codigo: 'S07',
    familias: [
      { id: 'F_7.1', nombre: 'Equipamiento de Seguridad', subfamilias: [
        { id: '07010001', nombre: 'Protección del Cabeza' },
        { id: '07010002', nombre: 'Protección de las Manos' },
        { id: '07010003', nombre: 'Protección del Cuerpo' },
        { id: '07010004', nombre: 'Protección de los Pies' },
      ]},
      { id: 'F_7.2', nombre: 'Herramientas', subfamilias: [
        { id: '07020100', nombre: 'Tornillería' },
        { id: '07020201', nombre: 'Herramientas Manuales' },
        { id: '07020202', nombre: 'Herramientas Manuales Aisladas VDE' },
        { id: '07020203', nombre: 'Herramientas Eléctricas' },
        { id: '07020205', nombre: 'Instrumentos de Medida Portátiles' },
      ]},
    ]
  },
  {
    nombre: 'Energías Renovables y Vehículo Eléctrico',
    codigo: 'S09',
    familias: [
      { id: 'F_9.2', nombre: 'Solar', subfamilias: [
        { id: '09020001', nombre: 'Módulos Fotovoltaicos' },
        { id: '09020101', nombre: 'Inversores de Aislada' },
        { id: '09020102', nombre: 'Inversores de Conexión a Red' },
        { id: '09020301', nombre: 'Accesorios Solar Térmica' },
        { id: '09020302', nombre: 'Reguladores de Carga' },
        { id: '09020303', nombre: 'Vatímetros' },
        { id: '09020304', nombre: 'Estructuras' },
        { id: '09020306', nombre: 'Cargadores' },
        { id: '09020401', nombre: 'Baterías' },
      ]},
      { id: 'F_9.4', nombre: 'Vehículo Eléctrico', subfamilias: [
        { id: '09040001', nombre: 'Cargador AC' },
        { id: '09040002', nombre: 'Cargador DC' },
        { id: '09040003', nombre: 'Accesorios Vehículo Eléctrico' },
      ]},
    ]
  },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrapeProducts(browser, subfamilia) {
  const page = await browser.newPage();
  const products = [];

  try {
    // Construir URL de la subfamilia
    const url = `https://tienda.sonepar.es/tienda/#/catalogo/familia/${subfamilia.id}`;
    console.log(`  📄 ${subfamilia.nombre}...`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);

    // Hacer scroll para cargar más productos
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(1000);
    }

    // Extraer productos
    const pageProducts = await page.evaluate(() => {
      const items = [];
      // Buscar tarjetas de producto - múltiples selectores posibles
      const selectors = [
        '[class*="product-card"]', '[class*="product-tile"]',
        '[class*="product"] a', '[class*="article"]',
        '.product-item', '.item-tile', '.article-card'
      ];
      
      let allElements = [];
      for (const sel of selectors) {
        allElements = [...allElements, ...document.querySelectorAll(sel)];
      }

      // Eliminar duplicados
      const seen = new Set();
      allElements = allElements.filter(el => {
        const text = el.textContent?.trim();
        if (!text || seen.has(text)) return false;
        seen.add(text);
        return true;
      });

      for (const el of allElements.slice(0, 100)) {
        const text = el.textContent?.trim() || '';
        
        // Buscar referencia (patrón: letras+números industrial)
        const refMatch = text.match(/\b([A-Z]{2,}[\d]{1,}[A-Z0-9\-]{2,})\b/);
        const priceMatch = text.match(/(\d+[,.]?\d{0,2})\s*€/);
        const brandMatch = text.match(/(Schneider|ABB|Siemens|Mitsubishi|IFM|Philips|Wallbox|Hager|Fronius|SMA|Victron|Pylontech|Ledvance|Zemper|Pepperl)/i);

        if (refMatch || (priceMatch && text.length > 20)) {
          items.push({
            ref: refMatch?.[1] || '',
            desc: text.substring(0, 120).trim(),
            marca: brandMatch?.[1] || '',
            precio: priceMatch?.[0] || '',
            raw: text.substring(0, 200),
          });
        }
      }
      return items;
    });

    products.push(...pageProducts);
    console.log(`    ✅ ${pageProducts.length} productos encontrados`);

  } catch (error) {
    console.log(`    ⚠️ Error: ${error.message.substring(0, 50)}`);
  } finally {
    await page.close();
  }

  return products;
}

async function main() {
  console.log('🚀 Scraper Catálogo Sonepar\n');
  console.log('Conectando a tienda.sonepar.es...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  // Ir a la tienda principal para aceptar cookies
  console.log('📍 Abriendo tienda...');
  const initPage = await context.newPage();
  await initPage.goto('https://tienda.sonepar.es/tienda/#/home', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // Aceptar cookies si aparece el banner
  try {
    const acceptBtn = await initPage.$('button:has-text("ACEPTAR"), button:has-text("Aceptar"), [class*="accept"]');
    if (acceptBtn) {
      await acceptBtn.click();
      console.log('✅ Cookies aceptadas\n');
      await sleep(2000);
    }
  } catch {}

  const allProducts = {};
  let totalProductos = 0;

  // Iterar por cada categoría
  for (const categoria of CATEGORIAS) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📂 ${categoria.nombre} (${categoria.codigo})`);
    console.log('═'.repeat(60));
    
    allProducts[categoria.nombre] = { familias: {} };

    // Iterar por cada familia
    for (const familia of categoria.familias) {
      console.log(`\n  📁 ${familia.nombre}`);
      allProducts[categoria.nombre].familias[familia.nombre] = { subfamilias: {} };

      // Iterar por cada subfamilia
      for (const subfamilia of familia.subfamilias) {
        const productos = await scrapeProducts(browser, subfamilia);
        totalProductos += productos.length;
        allProducts[categoria.nombre].familias[familia.nombre].subfamilias[subfamilia.nombre] = {
          codigo: subfamilia.id,
          productos: productos,
          count: productos.length,
        };
      }
    }

    // Guardar progreso
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
    console.log(`\n💾 Progreso guardado: ${totalProductos} productos totales`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  
  for (const [catName, catData] of Object.entries(allProducts)) {
    const total = Object.values(catData.familias).reduce((sum, fam) => 
      sum + Object.values(fam.subfamilias).reduce((s, sub) => s + sub.count, 0), 0);
    console.log(`${catName.padEnd(40)} ${total} productos`);
  }
  
  console.log('-'.repeat(60));
  console.log(`TOTAL: ${totalProductos} productos`);
  console.log(`Archivo: ${OUTPUT_FILE}`);
  console.log('='.repeat(60));

  // Generar formato para catalogoSonepar.js
  console.log('\n📝 Generando formato catalogoSonepar.js...\n');
  
  const catalogoJS = [];
  for (const [catName, catData] of Object.entries(allProducts)) {
    for (const [famName, famData] of Object.entries(catData.familias)) {
      for (const [subName, subData] of Object.entries(famData.subfamilias)) {
        for (const prod of subData.productos) {
          if (prod.ref) {
            catalogoJS.push({
              ref: prod.ref,
              desc: prod.desc || prod.raw || '',
              marca: prod.marca || 'Varias',
              familia: catName,
              gama: famName,
              tipo: subName,
              precio: prod.precio || '',
              pdf_url: '',
              imagen: '',
              keywords: [catName.toLowerCase(), famName.toLowerCase(), prod.marca?.toLowerCase() || ''].filter(Boolean),
            });
          }
        }
      }
    }
  }

  const jsOutput = path.join(OUTPUT_DIR, 'catalogo-formato-js.json');
  fs.writeFileSync(jsOutput, JSON.stringify(catalogoJS, null, 2));
  console.log(`✅ ${catalogoJS.length} referencias en formato JS guardadas en: ${jsOutput}`);

  await browser.close();
}

main().catch(console.error);
