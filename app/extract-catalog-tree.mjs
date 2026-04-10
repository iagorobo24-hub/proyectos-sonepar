/**
 * Extrae la estructura completa del catálogo Sonepar
 * Genera un árbol jerárquico: Familia → Subfamilia → Artículos
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'sonepar-catalog-scraper', 'catalog-api-data.json');
const OUTPUT_FILE = path.join(process.cwd(), 'sonepar-catalog-scraper', 'catalog-tree.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const catalog = data[0].data.dataRes.familias;

function buildTree(familias, depth = 0, path = '') {
  return familias.map(fam => {
    const node = {
      nombre: fam.nombre || fam.descripcion?.substring(0, 80) || '???',
      codigo: fam.codigo,
      articulos: fam.numArticulos || 0,
      url: fam.url || '',
      path: path ? `${path} > ${fam.nombre}` : fam.nombre
    };

    if (fam.familias && fam.familias.length > 0 && depth < 3) {
      node.hijos = buildTree(fam.familias, depth + 1, node.path);
    }

    return node;
  });
}

const tree = buildTree(catalog);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tree, null, 2));

console.log('📊 ÁRBOL DEL CATÁLOGO SONEPAR\n');
console.log('='.repeat(70));

function printTree(nodes, indent = '') {
  nodes.forEach(node => {
    const icon = node.hijos ? '📂' : '📄';
    console.log(`${indent}${icon} ${node.nombre}`);
    console.log(`${indent}   └─ ${node.articulos.toLocaleString()} artículos | Código: ${node.codigo}`);
    if (node.hijos) {
      printTree(node.hijos, indent + '   ');
    }
  });
}

printTree(tree);

console.log('\n' + '='.repeat(70));
console.log(`\n📁 Árbol guardado en: ${OUTPUT_FILE}`);

// Extraer específicamente las categorías relevantes para nuestra app
const categoriasRelevantes = ['CONTROL Y AUTOMATIZACION', 'DISTRIBUCION DE POTENCIA', 'ILUMINACION', 'ENERGIAS RENOVABLES'];

console.log('\n CATEGORÍAS RELEVANTES PARA NUESTRA APP:');
tree.filter(f => categoriasRelevantes.some(c => f.nombre.toUpperCase().includes(c)))
  .forEach(fam => {
    console.log(`\n${fam.nombre} (${fam.articulos.toLocaleString()} artículos)`);
    if (fam.hijos) {
      fam.hijos.forEach(sub => {
        console.log(`  ├─ ${sub.nombre} (${sub.articulos.toLocaleString()})`);
        if (sub.hijos) {
          sub.hijos.slice(0, 10).forEach(subsub => {
            console.log(`  │  └─ ${subsub.nombre} (${subsub.articulos.toLocaleString()})`);
          });
        }
      });
    }
  });
