/**
 * Sincronizador Maestro: Catálogo Real -> Firestore
 * Sube automáticamente el catálogo más reciente y habilita búsqueda por nombre
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Buscar el archivo más reciente (v12 es el objetivo)
const SCRAPER_DIR = './sonepar-catalog-scraper';
const RESULT_FILES = [
  'catalogo-final-v12.json',
  'catalogo-v11-completo.json',
  'catalogo-v7.json'
];

let sourceFile = null;
for (const file of RESULT_FILES) {
  const fullPath = path.join(SCRAPER_DIR, file);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 1000) {
    sourceFile = fullPath;
    break;
  }
}

const SERVICE_ACCOUNT_PATH = './service-account.json';

if (!sourceFile) {
  console.error('❌ Error: No se ha encontrado ningún archivo de catálogo para subir.');
  process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: Falta service-account.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function sync() {
  console.log(`🚀 Sincronizando desde: ${sourceFile}`);
  const rawData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  console.log(`📦 Procesando ${rawData.length.toLocaleString()} productos...`);

  // 1. Reconstruir jerarquía para navegación web
  const tree = {};
  const cleanProducts = [];
  const seenRefs = new Set();

  rawData.forEach(p => {
    const ref = p.ref || p.refSonepar;
    if (!ref || seenRefs.has(ref)) return;
    seenRefs.add(ref);
    cleanProducts.push(p);

    const f1 = p.familia || 'OTRAS';
    const br = p.marca || 'GENÉRICO';
    const f2 = p.gama || 'GENERAL';
    const f3 = p.tipo || 'GENERAL';

    if (!tree[f1]) tree[f1] = {};
    if (!tree[f1][br]) tree[f1][br] = {};
    if (!tree[f1][br][f2]) tree[f1][br][f2] = new Set();
    tree[f1][br][f2].add(f3);
  });

  // Convertir Sets a Arrays para Firestore
  const finalTree = {};
  for (const f1 in tree) {
    finalTree[f1] = {};
    for (const br in tree[f1]) {
      finalTree[f1][br] = {};
      for (const f2 in tree[f1][br]) {
        finalTree[f1][br][f2] = Array.from(tree[f1][br][f2]).sort();
      }
    }
  }

  // Subir Metadatos
  await db.collection('catalog_metadata').doc('hierarchy').set({
    tree: finalTree,
    totalProducts: cleanProducts.length,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: path.basename(sourceFile)
  });
  console.log('✅ Estructura de navegación actualizada.');

  // 2. Subir Productos con palabras clave para búsqueda
  const BATCH_SIZE = 500;
  for (let i = 0; i < cleanProducts.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = cleanProducts.slice(i, i + BATCH_SIZE);

    chunk.forEach(p => {
      // Priorizar referencia de fabricante como ID de documento
      const refFabricante = p.ref; 
      const refSonepar = p.refSonepar;
      const docId = (refFabricante || refSonepar).replace(/\//g, '_');
      const docRef = db.collection('catalog_products').doc(docId);
      
      // Generar bolsa de palabras para búsqueda (keywords)
      const nameWords = (p.nombre || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      const searchKeywords = new Set([
        (refFabricante || '').toLowerCase(),
        (refSonepar || '').toLowerCase(),
        (p.marca || '').toLowerCase(),
        (p.familia || '').toLowerCase(),
        ...nameWords
      ]);

      batch.set(docRef, {
        ...p,
        ref: refFabricante, // Referencia oficial fabricante
        refSonepar: refSonepar, // Referencia tienda Sonepar
        searchKeywords: Array.from(searchKeywords).filter(Boolean),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    if (i % 2000 === 0) console.log(`   [${i}/${cleanProducts.length}] sincronizados...`);
  }

  console.log(`\n🎉 ¡Hecho! ${cleanProducts.length} productos reales disponibles en la web.`);
  process.exit(0);
}

sync().catch(console.error);
