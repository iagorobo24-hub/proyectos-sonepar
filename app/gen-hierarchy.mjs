import fs from 'fs';
const rawData = JSON.parse(fs.readFileSync('./sonepar-catalog-scraper/catalogo-v7.json', 'utf8'));
console.log('📦 Productos:', rawData.length);
const tree = {};
rawData.forEach(p => {
  const f1 = p.familia || 'OTRAS';
  const br = p.marca || 'GENÉRICO';
  const f2 = p.gama || 'GENERAL';
  const f3 = p.tipo || 'GENERAL';
  if (!tree[f1]) tree[f1] = {};
  if (!tree[f1][br]) tree[f1][br] = {};
  if (!tree[f1][br][f2]) tree[f1][br][f2] = new Set();
  tree[f1][br][f2].add(f3);
});
const clean = {};
for (const f1 in tree) {
  clean[f1] = {};
  for (const br in tree[f1]) {
    clean[f1][br] = {};
    for (const f2 in tree[f1][br]) {
      clean[f1][br][f2] = Array.from(tree[f1][br][f2]).sort();
    }
  }
}
fs.writeFileSync('./sonepar-catalog-scraper/hierarchy.json', JSON.stringify(clean, null, 2));
const sizeKB = (fs.statSync('./sonepar-catalog-scraper/hierarchy.json').size / 1024).toFixed(0);
console.log(`✅ hierarchy.json: ${sizeKB} KB`);
Object.keys(clean).forEach(f => {
  const brands = Object.keys(clean[f]).length;
  let subFams = 0;
  Object.values(clean[f]).forEach(br => { subFams += Object.keys(br).length; });
  console.log(`  └─ ${f}: ${brands} marcas, ${subFams} subfamilias`);
});
// Copy to data folder
fs.copyFileSync('./sonepar-catalog-scraper/hierarchy.json', './src/data/hierarchy.json');
console.log('✅ Copiado a src/data/hierarchy.json');
