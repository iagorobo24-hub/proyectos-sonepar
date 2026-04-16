/**
 * Generador de Tareas V9 — Brand Splitter
 * Crea la lista de combinaciones Familia + Marca para el scrapeo masivo
 */

import fs from 'fs';
import path from 'path';

const HIERARCHY_FILE = './sonepar-catalog-scraper/hierarchy.json';
const FAMILIAS_FILE = './sonepar-catalog-scraper/todas-familias-confirmadas.json';
const TASKS_FILE = './sonepar-catalog-scraper/tareas-v9.json';

function main() {
  console.log('📋 Generando lista de tareas Familia + Marca...');

  if (!fs.existsSync(HIERARCHY_FILE) || !fs.existsSync(FAMILIAS_FILE)) {
    console.error('❌ Faltan archivos de entrada (hierarchy.json o todas-familias-confirmadas.json)');
    return;
  }

  const hierarchy = JSON.parse(fs.readFileSync(HIERARCHY_FILE, 'utf8'));
  const familias = JSON.parse(fs.readFileSync(FAMILIAS_FILE, 'utf8'));

  const tasks = [];
  const seen = new Set();

  // Mapear slugs de familias a sus nombres en hierarchy
  // (Hierarchy usa nombres en mayúsculas como 'CABLES', 'ILUMINACION')
  const slugToHierarchyName = {};
  for (const f of familias) {
    const nameUpper = f.nombre.toUpperCase().trim();
    // Intentar encontrar el nombre más parecido en hierarchy
    for (const hName in hierarchy) {
      if (hName.includes(nameUpper) || nameUpper.includes(hName)) {
        slugToHierarchyName[f.slug] = hName;
      }
    }
  }

  // Generar combinaciones
  for (const f of familias) {
    const hName = slugToHierarchyName[f.slug];
    if (hName && hierarchy[hName]) {
      const brands = Object.keys(hierarchy[hName]);
      for (const brand of brands) {
        const taskId = `${f.slug}|${brand}`;
        if (!seen.has(taskId)) {
          tasks.push({
            familiaSlug: f.slug,
            familiaNombre: f.nombre,
            marca: brand,
            id: taskId
          });
          seen.add(taskId);
        }
      }
    } else {
      // Si no hay marcas en la jerarquía, añadimos la familia sola
      tasks.push({
        familiaSlug: f.slug,
        familiaNombre: f.nombre,
        marca: null,
        id: f.slug
      });
    }
  }

  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  
  console.log(`\n✅ Lista de tareas generada:`);
  console.log(`  - Total combinaciones detectadas: ${tasks.length}`);
  console.log(`  - Familias procesadas: ${familias.length}`);
  console.log(`\n💾 Archivo guardado: ${TASKS_FILE}`);
}

main();
