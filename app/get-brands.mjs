/**
 * Get all unique brands from Firestore catalog
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function getBrands() {
  console.log('🔍 Obteniendo marcas únicas de Firestore...\n');
  
  const brands = new Set();
  
  // Get sample of products
  const snap = await db.collection('catalog_products').select('marca').limit(5000).get();
  
  snap.forEach(doc => {
    const marca = doc.data().marca;
    if (marca) brands.add(marca);
  });

  console.log('📦 Marcas encontradas:', Array.from(brands).sort().join('\n'));
  console.log(`\nTotal: ${brands.size} marcas`);
  
  process.exit(0);
}

getBrands().catch(console.error);