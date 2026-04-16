/**
 * Verify Firestore Catalog Data
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Falta service-account.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function verify() {
  console.log('🔍 Verificando catálogo en Firestore...\n');

  // Check hierarchy
  const hierarchyDoc = await db.collection('catalog_metadata').doc('hierarchy').get();
  const hierarchyData = hierarchyDoc.data();
  
  if (hierarchyData && Object.keys(hierarchyData).length > 0) {
    console.log('✅ Jerarquía en Firestore:');
    console.log(`   📊 Total productos: ${hierarchyData.totalProducts?.toLocaleString() || 0}`);
    console.log(`   📂 Categorías: ${Object.keys(hierarchyData.tree || {}).length}`);
    console.log(`   🏷️ Primeras categorías: ${hierarchyData.categories?.slice(0, 10).join(', ')}${hierarchyData.categories?.length > 10 ? '...' : ''}`);
  } else {
    console.log('❌ NO hay jerarquía en Firestore');
  }

  // Check some products
  console.log('\n📦 Verificando productos...');
  const productsSnap = await db.collection('catalog_products').limit(3).get();
  
  if (productsSnap.size > 0) {
    console.log('✅ Productos encontrados:');
    productsSnap.forEach(doc => {
      const p = doc.data();
      console.log(`   • ${p.ref} - ${p.nombre?.substring(0, 50)}...`);
      console.log(`     Marca: ${p.marca}, Familia: ${p.familia}`);
    });
  } else {
    console.log('❌ NO hay productos en Firestore');
  }

  // Count total
  const countSnap = await db.collection('catalog_products').count().get();
  console.log(`\n📈 Total productos en Firestore: ${countSnap.data().count?.toLocaleString() || 0}`);

  process.exit(0);
}

verify().catch(console.error);