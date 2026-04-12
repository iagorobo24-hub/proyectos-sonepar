/**
 * Genera hierarchy.json desde catalogo-v6.json
 * Estructura: Familia → Marca → Gama → [Tipos]
 */
import fs from 'fs';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const JSON_OUTPUT = './sonepar-catalog-scraper/hierarchy.json';

console.log('📖 Leyendo catálogo...');
const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
console.log(`📦 ${rawData.length.toLocaleString()} productos`);

console.log('🌳 Construyendo jerarquía...');
const families = {};
let totalProducts = 0;
const seenRefs = new Set();

for (const p of rawData) {
  if (!p.ref || seenRefs.has(p.ref)) continue;
  seenRefs.add(p.ref);
  totalProducts++;

  const f1 = p.familia || 'OTRAS';
  const br = p.marca || 'GENÉRICO';
  const f2 = p.gama || 'GENERAL';
  const f3 = p.tipo || 'GENERAL';

  if (!families[f1]) families[f1] = {};
  if (!families[f1][br]) families[f1][br] = {};
  if (!families[f1][br][f2]) families[f1][br][f2] = new Set();
  families[f1][br][f2].add(f3);
}

// Convertir Sets a Arrays
const cleanFamilies = {};
for (const f1 in families) {
  cleanFamilies[f1] = {};
  for (const br in families[f1]) {
    cleanFamilies[f1][br] = {};
    for (const f2 in families[f1][br]) {
      cleanFamilies[f1][br][f2] = Array.from(families[f1][br][f2]).sort();
    }
  }
}

fs.writeFileSync(JSON_OUTPUT, JSON.stringify(cleanFamilies, null, 2));
const sizeKB = (fs.statSync(JSON_OUTPUT).size / 1024).toFixed(0);

const familyNames = Object.keys(cleanFamilies);
console.log(`\n📂 ${familyNames.length} familias, ${sizeKB} KB:`);
familyNames.forEach(f => {
  const brands = Object.keys(cleanFamilies[f]).length;
  console.log(`   └─ ${f}: ${brands} marcas`);
});

console.log(`\n✅ Guardado en ${JSON_OUTPUT}`);
