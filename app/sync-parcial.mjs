/**
 * Sync Parcial - Respeta límite de 50K escrituras/día de Firebase Spark
 * Sincroniza hasta el límite y guarda progreso para continuar mañana
 */
import fs from 'fs';
import crypto from 'crypto';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const PROJECT_ID = 'proyectos-sonepar';
const DAILY_WRITE_LIMIT = 50000;
const BATCH_SIZE = 10;
const PAUSE_MS = 10000;
const LOG_FILE = './sync-parcial-progress.log';
const STATE_FILE = './sync-state.json';

const log = (msg) => {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
};

const sa = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

// Obtener access token
async function getAccessToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600
  };

  const toSign = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256')
    .update(toSign)
    .sign(sa.private_key);

  const jwt = `${toSign}.${base64Url(signature)}`;

  const response = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) throw new Error(`Error token: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

function base64Url(input) {
  const encoded = typeof input === 'string' 
    ? Buffer.from(input).toString('base64')
    : input.toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Contar productos existentes en Firestore
async function countExistingProducts(token) {
  let total = 0;
  let nextPageToken = null;
  
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_products?pageSize=1`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) break;
    
    const data = await response.json();
    // No hay forma directa de contar sin paginar, así que usamos metadata
    // Asumimos que ya hay ~20K según verificación anterior
    break;
  } while (nextPageToken);
  
  return total;
}

// Convertir producto a formato Firestore
function toFirestoreDoc(p) {
  return {
    fields: {
      ref: { stringValue: p.ref },
      familia: { stringValue: p.familia || 'OTRAS' },
      marca: { stringValue: p.marca || 'GENÉRICO' },
      gama: { stringValue: p.gama || 'GENERAL' },
      tipo: { stringValue: p.tipo || 'GENERAL' },
      nombre: { stringValue: p.nombre || '' },
      descripcion: { stringValue: p.descripcion || '' },
      precio: p.precio ? { doubleValue: p.precio } : { nullValue: null },
      imagen: { stringValue: p.imagen || '' },
      url: { stringValue: p.url || '' },
      searchKeywords: { 
        stringValue: `${p.ref} ${p.marca} ${p.familia} ${p.gama} ${p.tipo} ${p.nombre}`.toLowerCase()
      },
      lastUpdated: { timestampValue: new Date().toISOString() }
    }
  };
}

// Batch write con retry
async function batchWriteWithRetry(token, writes, retries = 3) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
  
  const body = {
    writes: writes.map(w => ({
      update: {
        ...w.doc,
        name: `projects/${PROJECT_ID}/databases/(default)/documents/catalog_products/${w.ref}`
      }
    }))
  };
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) return await response.json();
      
      if (response.status === 429) {
        const waitMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        log(`     ⏳ Rate limit, esperando ${(waitMs/1000).toFixed(1)}s (intento ${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        const err = await response.text();
        throw new Error(`Error ${response.status}: ${err.substring(0, 100)}`);
      }
    } catch (error) {
      if (attempt === retries) throw error;
    }
  }
  
  throw new Error('Rate limit después de todos los reintentos');
}

// Guardar estado de sync
function saveState(syncedRefs) {
  const state = {
    lastSyncDate: new Date().toISOString(),
    syncedRefs: Array.from(syncedRefs),
    syncedCount: syncedRefs.size
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Cargar estado previo
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return new Set();
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return new Set(state.syncedRefs || []);
  } catch {
    return new Set();
  }
}

async function syncParcial() {
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  
  log('🚀 SYNC PARCIAL INICIADO (Respetando límite de 50K/día)');
  
  if (!fs.existsSync(JSON_SOURCE)) {
    log('❌ No existe catalogo-v6.json');
    return;
  }

  // Leer productos
  log('📖 Leyendo catálogo...');
  const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  log(`📦 ${rawData.length.toLocaleString()} productos cargados`);

  // Obtener token
  log('🔐 Obteniendo access token...');
  let token = await getAccessToken();
  log('✅ Token obtenido');

  // Verificar estado previo
  const previouslySynced = loadState();
  log(`📂 Productos ya sincronizados: ${previouslySynced.size.toLocaleString()}`);

  // Filtrar únicos y no sincronizados
  const seenRefs = new Set();
  const pendingDocs = [];
  
  for (const p of rawData) {
    if (!p.ref || seenRefs.has(p.ref)) continue;
    seenRefs.add(p.ref);
    
    if (previouslySynced.has(p.ref)) continue; // Ya sincronizado
    
    pendingDocs.push({ ref: p.ref, doc: toFirestoreDoc(p) });
  }
  
  log(`📝 Productos pendientes de sync: ${pendingDocs.length.toLocaleString()}`);
  
  // Calcular cuántos podemos subir hoy
  // Estimamos ~20K existentes + los que ya sincronizamos en esta sesión
  const estimatedExisting = 20000; // Basado en verificación anterior
  const writesUsedToday = previouslySynced.size;
  const writesRemaining = DAILY_WRITE_LIMIT - writesUsedToday;
  const toSyncToday = Math.min(pendingDocs.length, Math.max(0, writesRemaining));
  
  log('\n' + '='.repeat(50));
  log('📊 PLAN DE SYNC:');
  log(`   Límite diario: ${DAILY_WRITE_LIMIT.toLocaleString()}`);
  log(`   Ya usados (estimados): ${writesUsedToday.toLocaleString()}`);
  log(`   Restantes hoy: ${writesRemaining.toLocaleString()}`);
  log(`   A sincronizar hoy: ${toSyncToday.toLocaleString()}`);
  log(`   Para mañana: ${Math.max(0, pendingDocs.length - toSyncToday).toLocaleString()}`);
  log('='.repeat(50));
  
  if (toSyncToday <= 0) {
    log('\n⏸️  Límite diario alcanzado. Espera a mañana para continuar.');
    log('📁 Estado guardado en sync-state.json');
    return;
  }

  // Tomar solo los que podemos sincronizar hoy
  const todayBatch = pendingDocs.slice(0, toSyncToday);
  log(`\n📤 Iniciando sync de ${todayBatch.length} productos...`);
  
  let successCount = 0;
  let errorCount = 0;
  const syncedRefs = new Set(previouslySynced);

  for (let i = 0; i < todayBatch.length; i += BATCH_SIZE) {
    try {
      const chunk = todayBatch.slice(i, i + BATCH_SIZE);
      await batchWriteWithRetry(token, chunk, 3);
      successCount += chunk.length;
      
      chunk.forEach(w => syncedRefs.add(w.ref));

      const pct = ((successCount / todayBatch.length) * 100).toFixed(1);
      if (successCount % 500 === 0 || successCount === todayBatch.length) {
        log(`   ✅ ${successCount.toLocaleString()}/${todayBatch.length.toLocaleString()} (${pct}%)`);
      } else if (successCount % 100 === 0) {
        log(`   ✅ ${successCount.toLocaleString()} docs (${pct}%)`);
      }

      // Guardar estado cada 500
      if (successCount % 500 === 0) {
        saveState(syncedRefs);
      }

      // Pausa entre batches
      await new Promise(r => setTimeout(r, PAUSE_MS));

      // Renovar token cada 2000 docs
      if (i % 2000 === 0 && i > 0) {
        log('   🔄 Renovando token...');
        token = await getAccessToken();
      }
    } catch (error) {
      errorCount += BATCH_SIZE;
      log(`   ❌ Batch ${i}: ${error.message.substring(0, 80)}`);
      await new Promise(r => setTimeout(r, 30000)); // Pausa larga tras error
    }
  }

  // Guardar estado final
  saveState(syncedRefs);

  log('\n' + '='.repeat(50));
  log('🎉 SYNC PARCIAL COMPLETADO');
  log(`   ✅ Sincronizados hoy: ${successCount.toLocaleString()}`);
  log(`   ❌ Errores: ${errorCount.toLocaleString()}`);
  log(`   📊 Total en Firestore (estimado): ${(estimatedExisting + successCount).toLocaleString()}`);
  log(`   📝 Restante para mañana: ${(pendingDocs.length - successCount).toLocaleString()}`);
  log('='.repeat(50));
  log('\n📋 Para continuar mañana, ejecuta este mismo script nuevamente.');
}

syncParcial().catch(err => {
  log(`❌ ERROR: ${err.message}`);
  console.error(err);
  process.exit(1);
});
