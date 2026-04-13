/**
 * Generador de Tareas V9 Maestro
 * Asegura que TODAS las familias de Sonepar (incluyendo las grandes faltantes) sean procesadas
 */

import fs from 'fs';
import path from 'path';

const HIERARCHY_FILE = './sonepar-catalog-scraper/hierarchy.json';
const TASKS_FILE = './sonepar-catalog-scraper/tareas-v9.json';

function main() {
  console.log('📋 Generando Lista Maestra de Tareas V9...');

  const hierarchy = JSON.parse(fs.readFileSync(HIERARCHY_FILE, 'utf8'));

  // Estructura real de las 10 familias raíz de Sonepar
  const FAMILIAS_RAIZ = [
    { slug: 'cables', nombre: 'CABLES' },
    { slug: 'distribucion-potencia', nombre: 'DISTRIBUCION DE POTENCIA' },
    { slug: 'control-automatizacion-industrial', nombre: 'CONTROL Y AUTOMATIZACION INDUSTRIAL' },
    { slug: 'automatizacion-edificios', nombre: 'AUTOMATIZACION DE EDIFICIOS' },
    { slug: 'iluminacion', nombre: 'ILUMINACION' },
    { slug: 'tratamiento-aire', nombre: 'HVAC' },
    { slug: 'seguridad-herramientas', nombre: 'SEGURIDAD Y HERRAMIENTAS' },
    { slug: 'fontaneria', nombre: 'FONTANERIA' },
    { slug: 'solar', nombre: 'ENERGIAS RENOVABLES' },
    { slug: 'servicios', nombre: 'SERVICIOS' }
  ];

  const tasks = [];
  const seen = new Set();

  for (const f of FAMILIAS_RAIZ) {
    // Buscar marcas para esta familia en el árbol de jerarquía
    const hName = f.nombre;
    const brands = hierarchy[hName] ? Object.keys(hierarchy[hName]) : [];

    if (brands.length > 0) {
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
      // Si no hay marcas, añadimos la familia como tarea única
      tasks.push({
        familiaSlug: f.slug,
        familiaNombre: f.nombre,
        marca: null,
        id: f.slug
      });
    }
  }

  fs.mkdirSync('./sonepar-catalog-scraper', { recursive: true });
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  
  console.log(`\n✅ Lista Maestra Generada:`);
  console.log(`  - Total tareas (Familia + Marca): ${tasks.length}`);
  console.log(`  - Familias raíz cubiertas: ${FAMILIAS_RAIZ.length}`);
  console.log(`\n📊 Desglose por Familia Raíz:`);
  
  const stats = {};
  tasks.forEach(t => stats[t.familiaSlug] = (stats[t.familiaSlug] || 0) + 1);
  Object.entries(stats).forEach(([slug, count]) => {
    console.log(`  - ${slug.padEnd(35)}: ${count} tareas`);
  });

  console.log(`\n💾 Guardado en: ${TASKS_FILE}`);
}

main();
