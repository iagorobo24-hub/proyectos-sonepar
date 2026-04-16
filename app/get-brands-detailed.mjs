/**
 * Get all unique brands from Firestore with counts
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function getBrandsWithCounts() {
  console.log('🔍 Obteniendo marcas con conteos de Firestore...\n');
  
  const brands = new Map();
  
  // Get all products
  const snap = await db.collection('catalog_products').select('marca', 'familia').get();
  
  snap.forEach(doc => {
    const data = doc.data();
    const marca = data.marca;
    if (!marca) return;
    
    if (!brands.has(marca)) {
      brands.set(marca, { count: 0, familia: data.familia });
    }
    brands.get(marca).count++;
  });

  // Sort by count
  const sorted = Array.from(brands.entries())
    .sort((a, b) => b[1].count - a[1].count);

  console.log('📦 MARCAS CON PRODUCTOS:\n');
  console.log('| # | Marca | Productos | Familia |');
  console.log('|---|-------|-----------|---------|');
  
  sorted.forEach(([marca, data], i) => {
    console.log(`${i+1}. ${marca}: ${data.count} productos (${data.familia})`);
  });
  
  console.log(`\nTotal: ${brands.size} marcas`);
  
  process.exit(0);
}

getBrandsWithCounts().catch(console.error);