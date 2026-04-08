/**
 * Regenera catalogoSonepar.js desde los datos reales scrapeados (75K+ productos)
 */
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'sonepar-catalog-scraper');
const ROOT_DIR = path.join(process.cwd(), '..');
const APP_DIR = path.join(ROOT_DIR, 'app');
const RESULT_FILE = path.join(OUTPUT_DIR, 'catalogo-final-sonepar.json');
const OUTPUT_JS = path.join(APP_DIR, 'src/data/catalogoSonepar.js');

// Leer datos scrapeados
const scrapedData = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
console.log(`📦 Leyendo ${scrapedData.length} productos scrapeados...`);

// Limpiar y filtrar datos válidos
const validProducts = scrapedData.filter(p => 
  p.ref && p.ref.trim().length > 0 && 
  p.ref.length < 30 &&
  !p.ref.includes('\n')
);

console.log(`✅ Productos válidos: ${validProducts.length}`);

// Agrupar por familia para estadísticas
const porFamilia = {};
validProducts.forEach(p => {
  const fam = p.familia || 'Sin familia';
  if (!porFamilia[fam]) porFamilia[fam] = [];
  porFamilia[fam].push(p);
});

console.log('\n📂 Distribución:');
Object.entries(porFamilia).sort((a, b) => b[1].length - a[1].length).forEach(([fam, prods]) => {
  console.log(`  ${fam.padEnd(40)} ${prods.length} refs`);
});

// Función para escapar strings de forma segura
function safe(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r\t]/g, ' ').substring(0, 150).trim();
}

function safeKeyword(str) {
  if (!str) return '';
  return String(str).replace(/["\n\r\t\\]/g, ' ').trim().toLowerCase();
}

// Generar array de productos como string JSON
const productosJSON = validProducts.map(p => {
  return JSON.stringify({
    ref: p.ref,
    desc: (p.desc || '').replace(/[\n\r\t]/g, ' ').substring(0, 150),
    marca: p.marca || 'Varias',
    familia: p.familia || 'Varias',
    gama: (p.subfamilia || ''),
    tipo: (p.tipo || ''),
    precio: p.precio ? parseFloat(p.precio) || 0 : 0,
    pdf_url: p.url || '',
    imagen: '',
    keywords: [safeKeyword(p.familia), safeKeyword(p.marca), safeKeyword(p.subfamilia)].filter(Boolean),
  });
}).join(',\n  ');

// Crear archivo JS
const header = `/* Catálogo Sonepar Tools — Versión 4.0
 * Generado automáticamente desde tienda.sonepar.es
 * ${new Date().toISOString()}
 * Total: ${validProducts.length} referencias reales
 */

export const CATALOGO_PLANO = [
  ${productosJSON}
];
`;

fs.writeFileSync(OUTPUT_JS, header);
console.log(`\n✅ Catálogo generado: ${OUTPUT_JS}`);
console.log(`   ${validProducts.length} referencias escritas`);
