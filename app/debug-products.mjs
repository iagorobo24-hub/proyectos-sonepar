/**
 * Debug: Check actual product structure in Firestore
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function debug() {
  console.log('🔍 Debugging Firestore products...\n');

  // Get first 5 products to see structure
  const snap = await db.collection('catalog_products').limit(5).get();
  
  console.log('📦 Estructura de productos:\n');
  snap.forEach(doc => {
    const p = doc.data();
    console.log(`Ref: ${p.ref}`);
    console.log('Campos:', Object.keys(p).join(', '));
    console.log('---');
    console.log('familia:', p.familia);
    console.log('marca:', p.marca);
    console.log('gama:', p.gama);
    console.log('tipo:', p.tipo);
    console.log('nombre:', p.nombre?.substring(0, 60));
    console.log('=================\n');
  });

  process.exit(0);
}

debug().catch(console.error);