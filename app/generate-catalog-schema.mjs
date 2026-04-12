import fs from 'fs';

async function generateSchema() {
  const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
  
  if (!fs.existsSync(JSON_SOURCE)) {
    console.error('❌ No se encuentra el archivo del catálogo.');
    return;
  }

  console.log('📖 Cargando datos reales (esto puede tardar unos segundos)...');
  
  try {
    const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
    console.log(`📊 Total productos cargados: ${rawData.length}`);

    const tree = {};

    rawData.forEach(p => {
      const f1 = p.familia || 'OTRAS FAMILIAS';
      const f2 = p.gama || 'OTRAS SUBFAMILIAS';
      const f3 = p.tipo || 'GENERAL';

      if (!tree[f1]) tree[f1] = {};
      if (!tree[f1][f2]) tree[f1][f2] = new Set();
      tree[f1][f2].add(f3);
    });

    // Transformar Set a Array para el JSON final
    const finalTree = {};
    for (const f1 in tree) {
      finalTree[f1] = {};
      for (const f2 in tree[f1]) {
        finalTree[f1][f2] = Array.from(tree[f1][f2]).sort();
      }
    }

    fs.writeFileSync('./sonepar-catalog-scraper/estructura-completa.json', JSON.stringify(finalTree, null, 2));
    
    console.log('\n✅ ESTRUCTURA REAL DE SONEPAR GENERADA');
    console.log('=======================================');
    Object.keys(finalTree).forEach(f1 => {
      console.log(`\n📂 ${f1}`);
      Object.keys(finalTree[f1]).forEach(f2 => {
        console.log(`   ├── ${f2} (${finalTree[f1][f2].length} tipos)`);
      });
    });

  } catch (err) {
    console.error('❌ Error al procesar el JSON:', err);
  }
}

generateSchema().catch(console.error);
