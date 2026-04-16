/**
 * Sincronización Optimizada: Catálogo Sonepar -> Firestore
 * Optimizada para 64k+ productos con uso eficiente de memoria
 */
import admin from 'firebase-admin';
import fs from 'fs';

const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const SERVICE_ACCOUNT_PATH = './service-account.json';
const LOG_FILE = './sync-progress.log';
const BATCH_SIZE = 300;

const log = (msg) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
};

// Manejo de errores
process.on('uncaughtException', (error) => {
  log(`❌ ERROR: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`❌ PROMESA: ${reason}`);
  process.exit(1);
});

// Inicializar Firebase
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Falta service-account.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function syncOptimized() {
  // Limpiar log
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  
  log('🚀 SYNC OPTIMIZADO INICIADO');
  
  if (!fs.existsSync(JSON_SOURCE)) {
    log('❌ No existe catalogo-v6.json');
    return;
  }

  // Leer JSON una sola vez
  log('📖 Leyendo catálogo...');
  const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  log(`📦 ${rawData.length.toLocaleString()} productos cargados`);

  // Procesar en chunks para evitar memoria excesiva
  log('🔄 Procesando productos...');
  const seenRefs = new Set();
  const cleanProducts = [];
  const families = new Set();
  
  // Procesar solo campos necesarios
  for (const p of rawData) {
    if (!p.ref || seenRefs.has(p.ref)) continue;
    seenRefs.add(p.ref);
    
    cleanProducts.push({
      ref: p.ref,
      familia: p.familia || 'OTRAS',
      marca: p.marca || 'GENÉRICO',
      gama: p.gama || 'GENERAL',
      tipo: p.tipo || 'GENERAL',
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      precio: p.precio || null,
      imagen: p.imagen || '',
      url: p.url || ''
    });
    
    families.add(p.familia || 'OTRAS');
  }
  
  log(`✅ ${cleanProducts.length.toLocaleString()} productos únicos listos`);
  log(`📂 ${families.size} familias detectadas: ${Array.from(families).join(', ')}`);

  // Guardar jerarquía simplificada
  log('💾 Guardando jerarquía...');
  await db.collection('catalog_metadata').doc('hierarchy').set({
    totalProducts: cleanProducts.length,
    families: Array.from(families).sort(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  log('✅ Jerarquía guardada');

  // Subir productos en batches
  log(`\n📤 Subiendo en batches de ${BATCH_SIZE}...`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < cleanProducts.length; i += BATCH_SIZE) {
    try {
      const batch = db.batch();
      const chunk = cleanProducts.slice(i, i + BATCH_SIZE);

      for (const p of chunk) {
        const docRef = db.collection('catalog_products').doc(p.ref);
        batch.set(docRef, {
          ...p,
          searchKeywords: `${p.ref} ${p.marca} ${p.familia} ${p.gama} ${p.tipo} ${p.nombre}`.toLowerCase(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      successCount += chunk.length;
      
      // Log cada 1000 productos
      if (successCount % 1000 === 0 || successCount === cleanProducts.length) {
        const pct = ((successCount / cleanProducts.length) * 100).toFixed(1);
        log(`   ✅ ${successCount.toLocaleString()}/${cleanProducts.length.toLocaleString()} (${pct}%)`);
      }
      
      // Pausa cada 3000 productos
      if (i % 3000 === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (error) {
      errorCount += chunk.length;
      log(`   ❌ Batch ${i}: ${error.message}`);
    }
  }

  log('\n' + '='.repeat(50));
  log('🎉 SINCRONIZACIÓN COMPLETADA');
  log(`   ✅ Exitosos: ${successCount.toLocaleString()}`);
  log(`   ❌ Errores: ${errorCount.toLocaleString()}`);
  log(`   📁 Log: ${LOG_FILE}`);
  log('='.repeat(50));
  
  process.exit(0);
}

syncOptimized();
