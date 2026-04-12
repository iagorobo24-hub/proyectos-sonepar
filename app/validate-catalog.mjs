/**
 * Validación del Catálogo Sonepar (catalogo-v6.json)
 * Verifica estructura, campos obligatorios, nulos y jerarquías
 */
import fs from 'fs';
import path from 'path';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';

console.log('🔍 Iniciando validación del catálogo...\n');

if (!fs.existsSync(JSON_SOURCE)) {
  console.error('❌ Error: No se encuentra catalogo-v6.json');
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
console.log(`📦 Total productos: ${rawData.length.toLocaleString()}\n`);

// Validación de campos
const requiredFields = ['ref', 'familia', 'marca', 'gama', 'tipo'];
const optionalFields = ['nombre', 'descripcion', 'precio', 'imagen', 'url'];

let errors = [];
let warnings = [];
let validCount = 0;
let seenRefs = new Set();
let duplicates = 0;

rawData.forEach((p, idx) => {
  // Verificar duplicados
  if (p.ref && seenRefs.has(p.ref)) {
    duplicates++;
  } else if (p.ref) {
    seenRefs.add(p.ref);
  }

  // Verificar campos obligatorios
  let itemErrors = [];
  requiredFields.forEach(field => {
    if (!p[field]) {
      itemErrors.push(`Falta campo obligatorio: ${field}`);
    }
  });

  if (itemErrors.length > 0) {
    errors.push({ index: idx, ref: p.ref || 'SIN_REF', errors: itemErrors });
  } else {
    validCount++;
  }

  // Advertencias para campos opcionales importantes
  if (!p.nombre) warnings.push(`Producto ${p.ref || idx}: Falta nombre`);
  if (!p.imagen && idx < 10) warnings.push(`Producto ${p.ref}: Falta imagen (primeros 10)`);
});

// Verificar jerarquías
console.log('📊 Verificando jerarquías...');
const hierarchy = {};
rawData.forEach(p => {
  const f1 = p.familia || 'OTRAS';
  const br = p.marca || 'GENÉRICO';
  const f2 = p.gama || 'GENERAL';
  const f3 = p.tipo || 'GENERAL';

  if (!hierarchy[f1]) hierarchy[f1] = {};
  if (!hierarchy[f1][br]) hierarchy[f1][br] = {};
  if (!hierarchy[f1][br][f2]) hierarchy[f1][br][f2] = new Set();
  hierarchy[f1][br][f2].add(f3);
});

// Resumen
console.log('\n✅ RESULTADOS DE VALIDACIÓN\n');
console.log('═'.repeat(50));
console.log(`✓ Productos válidos: ${validCount.toLocaleString()}`);
console.log(`✗ Errores: ${errors.length.toLocaleString()}`);
console.log(`⚠️  Duplicados: ${duplicates.toLocaleString()}`);
console.log(`⚠️  Advertencias: ${warnings.length.toLocaleString()}`);
console.log(`✓ Referencias únicas: ${seenRefs.size.toLocaleString()}`);
console.log('═'.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ PRIMEROS 5 ERRORES:');
  errors.slice(0, 5).forEach(e => {
    console.log(`  [${e.index}] Ref: ${e.ref} → ${e.errors.join(', ')}`);
  });
}

console.log('\n📂 JERARQUÍAS DETECTADAS:');
Object.keys(hierarchy).forEach(f1 => {
  const marcas = Object.keys(hierarchy[f1]).length;
  console.log(`  └─ ${f1}: ${marcas} marca(s)`);
});

console.log('\n⚠️  PRIMERAS 5 ADVERTENCIAS:');
warnings.slice(0, 5).forEach(w => console.log(`  ${w}`));

console.log('\n' + (errors.length === 0 ? '✅ Catálogo VÁLIDO para sync' : '⚠️  Revisar errores antes del sync'));
console.log(`\n📝 Próximos pasos: ${validCount > 0 ? 'Ejecutar sync-catalog-to-firestore.mjs' : 'Corregir errores primero'}`);
