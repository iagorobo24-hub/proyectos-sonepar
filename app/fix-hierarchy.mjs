/**
 * Fix Hierarchy Metadata in Firestore
 * Rebuilds the hierarchy from actual products in the database
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function fixHierarchy() {
  console.log('🔧 Corrigiendo jerarquía en Firestore...\n');

  // Get all unique familia/marca/gama/tipo from products
  const hierarchy = {};
  
  // Get all products (in batches)
  const allProducts = [];
  let lastDoc = null;
  
  do {
    let q = db.collection('catalog_products').limit(1000);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    
    if (snap.empty) break;
    
    lastDoc = snap.docs[snap.docs.length - 1];
    snap.forEach(doc => allProducts.push(doc.data()));
    
    console.log(`   📦 Leídos ${allProducts.length} productos...`);
  } while (allProducts.length < 25000);

  console.log(`✅ Total productos: ${allProducts.length}`);

  // Build hierarchy
  for (const p of allProducts) {
    const familia = p.familia || 'OTRAS';
    const marca = p.marca || 'GENÉRICO';
    const gama = p.gama || 'GENERAL';
    const tipo = p.tipo || 'GENERAL';

    if (!hierarchy[familia]) hierarchy[familia] = {};
    if (!hierarchy[familia][marca]) hierarchy[familia][marca] = {};
    if (!hierarchy[familia][marca][gama]) hierarchy[familia][marca][gama] = new Set();
    hierarchy[familia][marca][gama].add(tipo);
  }

  // Convert Sets to Arrays
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

  // Update hierarchy in Firestore
  await db.collection('catalog_metadata').doc('hierarchy').set({
    tree,
    totalProducts: allProducts.length,
    categories: Object.keys(tree).sort(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('\n✅ Jerarquía actualizada:');
  console.log(`   📊 Productos: ${allProducts.length}`);
  console.log(`   📂 Familias: ${Object.keys(tree).length}`);
  console.log(`   🏷️ Lista: ${Object.keys(tree).join(', ')}`);

  process.exit(0);
}

fixHierarchy().catch(console.error);