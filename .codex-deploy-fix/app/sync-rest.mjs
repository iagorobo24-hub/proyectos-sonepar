/**
 * Sync usando REST API de Firestore (evita SDK firebase-admin)
 * Funciona cuando el SDK se queda colgado
 */
import fs from 'fs';
import crypto from 'crypto';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const PROJECT_ID = 'proyectos-sonepar';
const BATCH_SIZE = 100;
const LOG_FILE = './sync-rest-progress.log';

const log = (msg) => {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
};

// Leer service account
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
      }
    }
  };
}

// Batch write via REST (más eficiente) con retry para 429
async function batchWriteWithRetry(token, writes, retries = 3) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
  
  const body = {
    writes: writes.map(w => ({
      update: {
        ...w.doc,
        name: `projects/${PROJECT_ID}/databases/(default)/documents/catalog_products/${w.ref}`,
        fields: {
          ...w.doc.fields,
          lastUpdated: { timestampValue: new Date().toISOString() }
        }
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
        // Rate limit - esperar y reintentar
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

// Actualizar jerarquía
async function updateHierarchy(token, total) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_metadata/hierarchy`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        totalProducts: { integerValue: String(total) },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    })
  });
}

async function syncRest() {
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  
  log('🚀 SYNC VÍA REST API (BATCH) INICIADO');
  
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

  // Actualizar jerarquía
  log('💾 Guardando jerarquía...');
  await updateHierarchy(token, rawData.length);
  log('✅ Jerarquía actualizada');

  // Preparar documentos únicos
  log('🔄 Preparando documentos...');
  const seenRefs = new Set();
  const uniqueDocs = [];
  
  for (const p of rawData) {
    if (!p.ref || seenRefs.has(p.ref)) continue;
    seenRefs.add(p.ref);
    uniqueDocs.push({ ref: p.ref, doc: toFirestoreDoc(p) });
  }
  
  log(`✅ ${uniqueDocs.length.toLocaleString()} documentos únicos preparados`);

  // Batch write en chunks de 10 (muy pequeño para evitar rate limit)
  const BATCH_SIZE = 10;
  const PAUSE_MS = 10000; // 10 segundos entre batches
  
  log(`\n📤 Subiendo en batches de ${BATCH_SIZE} con pausa de ${PAUSE_MS/1000}s...`);
  log('⏳ Esperando 30s para que se resetee la cuota...');
  await new Promise(r => setTimeout(r, 30000));
  
  let successCount = 0;
  let errorCount = 0;
  let consecutiveErrors = 0;

  for (let i = 0; i < uniqueDocs.length; i += BATCH_SIZE) {
    try {
      const chunk = uniqueDocs.slice(i, i + BATCH_SIZE);
      await batchWriteWithRetry(token, chunk, 5); // 5 reintentos
      successCount += chunk.length;
      consecutiveErrors = 0;

      const pct = ((successCount / uniqueDocs.length) * 100).toFixed(2);
      if (successCount % 100 === 0 || successCount === uniqueDocs.length) {
        log(`   ✅ ${successCount.toLocaleString()}/${uniqueDocs.length.toLocaleString()} (${pct}%)`);
      } else if (successCount % 50 === 0) {
        log(`   ✅ ${successCount.toLocaleString()} docs (${pct}%)`);
      }

      // Pausa fija entre batches
      await new Promise(r => setTimeout(r, PAUSE_MS));

      // Renovar token cada 2000 docs
      if (i % 2000 === 0 && i > 0) {
        log('   🔄 Renovando token...');
        token = await getAccessToken();
      }
    } catch (error) {
      errorCount += BATCH_SIZE;
      consecutiveErrors++;
      log(`   ❌ Batch ${i}: ${error.message.substring(0, 80)}`);
      
      // Si muchos errores consecutivos, pausa muy larga
      if (consecutiveErrors >= 3) {
        const longPause = 60000; // 1 minuto
        log(`   ⏸️  Pausa larga de ${longPause/1000}s por ${consecutiveErrors} errores consecutivos`);
        await new Promise(r => setTimeout(r, longPause));
        consecutiveErrors = 0;
      }
    }
  }

  log('\n' + '='.repeat(50));
  log('🎉 SINCRONIZACIÓN COMPLETADA');
  log(`   ✅ Exitosos: ${successCount.toLocaleString()}`);
  log(`   ❌ Errores: ${errorCount.toLocaleString()}`);
  log('='.repeat(50));
}

syncRest().catch(err => {
  log(`❌ ERROR: ${err.message}`);
  console.error(err);
  process.exit(1);
});
