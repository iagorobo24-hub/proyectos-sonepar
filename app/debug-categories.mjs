/**
 * Debug: Check category distribution in Firestore
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function debug() {
  console.log('🔍 Analizando distribución de categorías...\n');

  // Get unique families
  const snap = await db.collection('catalog_products').select('familia', 'marca', 'gama').limit(1000).get();
  
  const familias = new Set();
  const marcas = new Set();
  const gamas = new Set();
  
  snap.forEach(doc => {
    const d = doc.data();
    if (d.familia) familias.add(d.familia);
    if (d.marca) marcas.add(d.marca);
    if (d.gama) gamas.add(d.gama);
  });

  console.log('📊 Familias únicas (sample):', Array.from(familias).slice(0, 20));
  console.log('\n📊 Marcas únicas (sample):', Array.from(marcas).slice(0, 20));
  console.log('\n📊 Gamas únicas (sample):', Array.from(gamas).slice(0, 20));

  // Check hierarchy doc
  console.log('\n--- Jerarquía en Firestore ---');
  const hierDoc = await db.collection('catalog_metadata').doc('hierarchy').get();
  const hier = hierDoc.data();
  console.log('Categorías en jerarquía:', Object.keys(hier.tree || {}));
  console.log('Total products:', hier.totalProducts);

  process.exit(0);
}

debug().catch(console.error);