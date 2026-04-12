/**
 * Test rápido de conexión a Firestore
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

console.log('🔌 Conectando a Firestore...');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function test() {
  try {
    console.log('⏳ Probando escritura...');
    await db.collection('test').doc('connection').set({
      timestamp: new Date().toISOString(),
      status: 'ok'
    });
    console.log('✅ Escritura exitosa');
    
    console.log('⏳ Probando lectura...');
    const doc = await db.collection('test').doc('connection').get();
    console.log('✅ Lectura exitosa:', doc.data());
    
    console.log('⏳ Contando productos existentes...');
    const snapshot = await db.collection('catalog_products').count().get();
    console.log(`📦 Productos actuales: ${snapshot.data().count}`);
    
    console.log('\n✅ CONEXIÓN FUNCIONA CORRECTAMENTE');
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

test();
