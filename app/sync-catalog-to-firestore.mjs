/**
 * Sincronización Masiva: Catálogo Sonepar -> Firestore
 * Procesa todas las familias, marcas y productos sin límites de forma eficiente.
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const SERVICE_ACCOUNT_PATH = './service-account.json';

// Inicialización de Firebase Admin
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: No se encuentra el archivo service-account.json en app/');
  console.log('💡 Descarga el JSON desde Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncAll() {
  console.log('🚀 Iniciando CARGA TOTAL del catálogo Sonepar a Firestore...');

  if (!fs.existsSync(JSON_SOURCE)) {
    console.error('❌ Error: No se encuentra el archivo del catálogo (catalogo-v6.json).');
    return;
  }

  console.log('📖 Leyendo archivo JSON (esto puede tardar unos segundos)...');
  const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  console.log(`📦 Total de productos detectados: ${rawData.length.toLocaleString()}`);

  // 1. GENERAR JERARQUÍA COMPLETA (Metadatos)
  console.log('📦 Generando metadatos de navegación global (Árbol de familias)...');
  const hierarchy = {};
  const seenRefs = new Set();
  const cleanProducts = [];

  rawData.forEach(p => {
    // Evitar duplicados y productos sin referencia
    if (!p.ref || seenRefs.has(p.ref)) return;
    seenRefs.add(p.ref);
    cleanProducts.push(p);

    const fam = p.familia || 'OTRAS FAMILIAS';
    const marca = p.marca || 'GENÉRICO';
    const gama = p.gama || 'ESTÁNDAR';

    if (!hierarchy[fam]) hierarchy[fam] = {};
    if (!hierarchy[fam][marca]) hierarchy[fam][marca] = new Set();
    hierarchy[fam][marca].add(gama);
  });

  // Convertir jerarquía de Sets a Arrays para Firestore
  const tree = {};
  for (const f in hierarchy) {
    tree[f] = {};
    for (const m in hierarchy[f]) {
      tree[f][m] = Array.from(hierarchy[f][m]).sort();
    }
  }

  console.log('📤 Subiendo metadatos de jerarquía...');
  await db.collection('catalog_metadata').doc('hierarchy').set({
    tree,
    totalProducts: cleanProducts.length,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✅ Jerarquía global actualizada.');

  // 2. SUBIDA MASIVA POR BLOQUES (BATCHES)
  // Firestore permite hasta 500 operaciones por batch.
  const BATCH_SIZE = 500;
  console.log(`📤 Subiendo ${cleanProducts.length.toLocaleString()} productos a Firestore...`);

  for (let i = 0; i < cleanProducts.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = cleanProducts.slice(i, i + BATCH_SIZE);

    chunk.forEach(p => {
      const docRef = db.collection('catalog_products').doc(p.ref);
      
      // Normalización final y generación de palabras clave para el buscador
      const searchKeywords = [
        p.ref.toLowerCase(),
        p.marca.toLowerCase(),
        p.familia.toLowerCase(),
        ...(p.gama ? p.gama.toLowerCase().split(' ') : []),
        ...(p.desc ? p.desc.toLowerCase().split(' ').filter(w => w.length > 3) : [])
      ];

      const cleanProduct = {
        ref: p.ref,
        desc: p.desc || '',
        marca: p.marca || 'GENÉRICO',
        familia: p.familia || '',
        gama: p.gama || '',
        tipo: p.tipo || '',
        precio: p.precio || 0,
        pdf_url: p.pdf_url || '',
        imagen: p.imagen || '',
        searchKeywords: Array.from(new Set(searchKeywords)).slice(0, 40), // Evitar doc size limits
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, cleanProduct, { merge: true });
    });

    await batch.commit();
    
    // Feedback de progreso cada 2500 productos
    if (i % 2500 === 0 || (i + BATCH_SIZE) >= cleanProducts.length) {
      const progress = Math.min(i + BATCH_SIZE, cleanProducts.length);
      const percent = ((progress / cleanProducts.length) * 100).toFixed(1);
      console.log(`   [${progress.toLocaleString()} / ${cleanProducts.length.toLocaleString()}] - ${percent}% completado...`);
    }
  }

  console.log('\n🎉 ¡SINCRONIZACIÓN FINALIZADA CON ÉXITO!');
  console.log(`✅ ${cleanProducts.length.toLocaleString()} productos están ahora en tu Firestore.`);
  process.exit(0);
}

syncAll().catch(err => {
  console.error('❌ Error crítico durante la sincronización:', err);
  process.exit(1);
});
