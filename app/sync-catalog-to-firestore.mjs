/**
 * Sincronización Masiva: Catálogo Sonepar -> Firestore
 * JERARQUÍA: Familia (N1) -> Marca -> Subfamilia (N2) -> Categoría (N3)
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const SERVICE_ACCOUNT_PATH = './service-account.json';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: Falta service-account.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function syncAll() {
  console.log('🚀 Iniciando CARGA TOTAL con jerarquía: N1 -> MARCA -> N2 -> N3');

  if (!fs.existsSync(JSON_SOURCE)) {
    console.error('❌ Error: No se encuentra catalogo-v6.json');
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  console.log(`📦 Productos: ${rawData.length.toLocaleString()}`);

  // 1. GENERAR JERARQUÍA PROFUNDA
  console.log('📦 Reorganizando mapa de navegación...');
  const hierarchy = {};
  const cleanProducts = [];
  const seenRefs = new Set();

  rawData.forEach(p => {
    if (!p.ref || seenRefs.has(p.ref)) return;
    seenRefs.add(p.ref);
    cleanProducts.push(p);

    const f1 = p.familia || 'OTRAS';
    const br = p.marca || 'GENÉRICO';
    const f2 = p.gama || 'GENERAL';
    const f3 = p.tipo || 'GENERAL';

    if (!hierarchy[f1]) hierarchy[f1] = {};
    if (!hierarchy[f1][br]) hierarchy[f1][br] = {};
    if (!hierarchy[f1][br][f2]) hierarchy[f1][br][f2] = new Set();
    hierarchy[f1][br][f2].add(f3);
  });

  // Convertir jerarquía para Firestore
  const tree = {};
  for (const f1 in hierarchy) {
    tree[f1] = {};
    for (const br in hierarchy[f1]) {
      tree[f1][br] = {};
      for (const f2 in hierarchy[f1][br]) {
        tree[f1][br][f2] = Array.from(hierarchy[f1][br][f2]).sort();
      }
    }
  }

  await db.collection('catalog_metadata').doc('hierarchy').set({
    tree,
    totalProducts: cleanProducts.length,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Jerarquía N1 -> MARCA -> N2 -> N3 actualizada.');

  // 2. SUBIDA DE PRODUCTOS (BATCHES)
  const BATCH_SIZE = 500;
  for (let i = 0; i < cleanProducts.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = cleanProducts.slice(i, i + BATCH_SIZE);

    chunk.forEach(p => {
      const docRef = db.collection('catalog_products').doc(p.ref);
      batch.set(docRef, {
        ...p,
        searchKeywords: [p.ref.toLowerCase(), p.marca.toLowerCase(), p.familia.toLowerCase()],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    if (i % 5000 === 0) console.log(`   [${i}/${cleanProducts.length}] sincronizados...`);
  }

  console.log('\n🎉 SINCRONIZACIÓN FINALIZADA');
  process.exit(0);
}

syncAll().catch(console.error);
