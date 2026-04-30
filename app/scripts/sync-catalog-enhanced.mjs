/**
 * Enhanced Catalog Sync: Sonepar -> Firestore
 * Creates complete product catalog with proper hierarchy
 * 
 * Expected data format from scraper:
 * - ref, refSonepar, nombre, marca, familia, precio, pvp, stock, pdf
 * 
 * Missing fields (gama, tipo) will be populated from hierarchy.json
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-final-v12.json';
const HIERARCHY_SOURCE = './src/data/hierarchy.json';
const SERVICE_ACCOUNT_PATH = './service-account.json';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: Falta service-account.json');
  console.log('💡 Crea un service account en Firebase Console > Configuración > Cuentas de servicio');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function syncCatalog() {
  console.log('🚀 Iniciando sincronización mejorada del catálogo...\n');

  // Load product data
  if (!fs.existsSync(JSON_SOURCE)) {
    console.error(`❌ Error: No se encuentra ${JSON_SOURCE}`);
    return;
  }

  const rawProducts = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  console.log(`📦 Productos en JSON: ${rawProducts.length.toLocaleString()}`);

  // Load local hierarchy for reference
  let localHierarchy = {};
  if (fs.existsSync(HIERARCHY_SOURCE)) {
    localHierarchy = JSON.parse(fs.readFileSync(HIERARCHY_SOURCE, 'utf8'));
    console.log('📂 Jerarquía local cargada');
  }

  // Build hierarchy from products and local data
  console.log('\n🔨 Construyendo jerarquía...');
  const hierarchy = {};
  const productsMap = new Map();
  const seenRefs = new Set();

  // Process products
  for (const p of rawProducts) {
    if (!p.ref || seenRefs.has(p.ref)) continue;
    seenRefs.add(p.ref);

    const familia = p.familia || 'OTRAS';
    const marca = p.marca || 'GENÉRICO';
    const nombre = p.nombre || '';
    
    // Extract potential gama/tipo from nombre if missing
    const gama = p.gama || extractGamaFromNombre(nombre) || 'GENERAL';
    const tipo = p.tipo || extractTipoFromNombre(nombre) || 'GENERAL';

    // Build product with complete fields
    const product = {
      ref: p.ref,
      refSonepar: p.refSonepar || '',
      nombre: p.nombre || '',
      marca: marca,
      familia: familia,
      gama: gama,      // May be extracted from nombre
      tipo: tipo,     // May be extracted from nombre
      precio: parsePrice(p.precio),
      pvp: parsePrice(p.pvp),
      stock: p.stock || 0,
      pdf: p.pdf || '',
      searchKeywords: generateSearchKeywords(p),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    productsMap.set(p.ref, product);

    // Build hierarchy tree
    if (!hierarchy[familia]) hierarchy[familia] = {};
    if (!hierarchy[familia][marca]) hierarchy[familia][marca] = {};
    if (!hierarchy[familia][marca][gama]) hierarchy[familia][marca][gama] = new Set();
    hierarchy[familia][marca][gama].add(tipo);
  }

  const products = Array.from(productsMap.values());
  console.log(`✅ Productos únicos: ${products.length.toLocaleString()}`);

  // Convert Sets to Arrays for Firestore
  const tree = {};
  for (const familia in hierarchy) {
    tree[familia] = {};
    for (const marca in hierarchy[familia]) {
      tree[familia][marca] = {};
      for (const gama in hierarchy[familia][marca]) {
        tree[familia][marca][gama] = Array.from(hierarchy[familia][marca][gama]).sort();
      }
    }
  }

  // Save hierarchy to Firestore
  console.log('\n💾 Guardando jerarquía en Firestore...');
  await db.collection('catalog_metadata').doc('hierarchy').set({
    tree,
    totalProducts: products.length,
    categories: Object.keys(tree).sort(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Jerarquía guardada');

  // Save products in batches
  console.log('\n📤 Subiendo productos a Firestore...');
  const BATCH_SIZE = 400;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(i, i + BATCH_SIZE);

    for (const p of chunk) {
      const docRef = db.collection('catalog_products').doc(p.ref);
      batch.set(docRef, p);
    }

    try {
      await batch.commit();
      uploaded += chunk.length;
    } catch (e) {
      errors += chunk.length;
      console.error(`   ⚠️ Error en batch: ${e.message}`);
    }
    
    const progress = ((i + chunk.length) / products.length * 100).toFixed(1);
    console.log(`   📊 Progreso: ${progress}% (${uploaded}/${products.length})`);
  }

  console.log('\n🎉 SINCRONIZACIÓN COMPLETADA');
  console.log(`   ✅ Productos subidos: ${uploaded}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📂 Categorías: ${Object.keys(tree).length}`);
  
  process.exit(0);
}

// Helper functions
function parsePrice(value) {
  if (!value) return 0;
  const str = value.toString().replace(/[^\d.,]/g, '');
  // Handle European format: strip thousands dots, then replace decimal comma
  const cleaned = str.includes(',') ? str.replace(/\./g, '').replace(',', '.') : str;
  return parseFloat(cleaned) || 0;
}

function extractGamaFromNombre(nombre) {
  if (!nombre) return null;
  const keywords = ['FIBRA', 'COBRE', 'CORDÓN', 'CONDUCTOR', 'CABLE'];
  for (const kw of keywords) {
    if (nombre.toUpperCase().includes(kw)) {
      return kw === 'FIBRA' ? 'CABLES DE DATOS' : 
             kw === 'COBRE' ? 'CABLES ESPECIALES' :
             kw === 'CORDÓN' ? 'CABLES ESPECIALES' :
             kw === 'CONDUCTOR' ? 'CABLES ESPECIALES' : 'CABLES DE BAJA TENSION';
    }
  }
  return null;
}

function extractTipoFromNombre(nombre) {
  if (!nombre) return null;
  // Try to extract common types from product name
  const match = nombre.match(/\d+x\d+|\d+G\d+|H07Z1|RZ1|RV-K|RV/i);
  return match ? match[0] : 'GENERAL';
}

function generateSearchKeywords(product) {
  const keywords = [
    product.ref?.toLowerCase(),
    product.refSonepar?.toLowerCase(),
    product.marca?.toLowerCase(),
    product.familia?.toLowerCase(),
    product.nombre?.toLowerCase().split(' ').slice(0, 5).join(' ')
  ].filter(Boolean);
  return [...new Set(keywords)];
}

syncCatalog().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});