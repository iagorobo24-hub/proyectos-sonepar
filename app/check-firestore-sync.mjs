/**
 * Verificación rápida de Firestore - ¿Cuántos productos hay sincronizados?
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

async function checkSync() {
  console.log('🔍 Verificando sync con Firestore...\n');

  try {
    // Contar productos
    const snapshot = await db.collection('catalog_products').count().get();
    console.log(`📦 Productos en Firestore: ${snapshot.data().count.toLocaleString()}`);

    // Verificar jerarquía
    const hierarchyDoc = await db.collection('catalog_metadata').doc('hierarchy').get();
    if (hierarchyDoc.exists) {
      const data = hierarchyDoc.data();
      console.log(`📂 Jerarquías: ${Object.keys(data.tree || {}).length} familias`);
      console.log(`📅 Última actualización: ${data.updatedAt?.toDate?.() || 'N/A'}`);
      
      // Mostrar familias
      console.log('\nFamilias detectadas:');
      Object.keys(data.tree || {}).forEach(f => console.log(`  └─ ${f}`));
    } else {
      console.log('⚠️  No hay jerarquía registrada');
    }

    // Mostrar ejemplo de producto
    const sample = await db.collection('catalog_products').limit(1).get();
    if (!sample.empty) {
      const prod = sample.docs[0].data();
      console.log('\n📝 Ejemplo de producto:');
      console.log(`  Ref: ${prod.ref}`);
      console.log(`  Familia: ${prod.familia}`);
      console.log(`  Marca: ${prod.marca}`);
      console.log(`  Gama: ${prod.gama}`);
      console.log(`  Tipo: ${prod.tipo}`);
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkSync();
