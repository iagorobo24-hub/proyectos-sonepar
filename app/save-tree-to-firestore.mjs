/**
 * Guarda el árbol de jerarquía en Firestore por familias separadas
 * Cada familia = 1 documento en catalog_tree/{familia}
 */
import fs from 'fs';
import crypto from 'crypto';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const JSON_SOURCE = './sonepar-catalog-scraper/catalogo-v6.json';
const PROJECT_ID = 'proyectos-sonepar';

const sa = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

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
  const signature = crypto.createSign('RSA-SHA256').update(toSign).sign(sa.private_key);
  const jwt = `${toSign}.${base64Url(signature)}`;
  const response = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  if (!response.ok) throw new Error(`Token error: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

function base64Url(input) {
  const encoded = typeof input === 'string' ? Buffer.from(input).toString('base64') : input.toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function saveFamilyToFirestore(token, familyName, familyData) {
  // Serializar como JSON string para evitar límite de 1MB de documento
  const jsonStr = JSON.stringify(familyData);
  console.log(`   📦 ${familyName}: ${(jsonStr.length / 1024).toFixed(1)} KB`);

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_tree/${encodeURIComponent(familyName)}`;

  const body = {
    fields: {
      data: { stringValue: jsonStr },
      familyName: { stringValue: familyName },
      updatedAt: { timestampValue: new Date().toISOString() }
    }
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log(`   ✅ ${familyName} guardada`);
        return true;
      }

      if (response.status === 429) {
        const wait = Math.pow(2, attempt) * 3000;
        console.log(`   ⏳ Rate limit, esperando ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        const err = await response.text();
        console.log(`   ❌ Error ${response.status}: ${err.substring(0, 150)}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (attempt >= 5) return false;
    }
  }
  return false;
}

async function main() {
  console.log('📖 Leyendo catálogo...');
  const rawData = JSON.parse(fs.readFileSync(JSON_SOURCE, 'utf8'));
  console.log(`📦 ${rawData.length.toLocaleString()} productos`);

  // Construir árbol: Familia → Marca → Gama → [Tipos]
  console.log('🌳 Construyendo árbol por familias...');
  const families = {};
  let totalProducts = 0;
  const seenRefs = new Set();

  for (const p of rawData) {
    if (!p.ref || seenRefs.has(p.ref)) continue;
    seenRefs.add(p.ref);
    totalProducts++;

    const f1 = p.familia || 'OTRAS';
    const br = p.marca || 'GENÉRICO';
    const f2 = p.gama || 'GENERAL';
    const f3 = p.tipo || 'GENERAL';

    if (!families[f1]) families[f1] = {};
    if (!families[f1][br]) families[f1][br] = {};
    if (!families[f1][br][f2]) families[f1][br][f2] = new Set();
    families[f1][br][f2].add(f3);
  }

  // Convertir Sets a Arrays
  const cleanFamilies = {};
  for (const f1 in families) {
    cleanFamilies[f1] = {};
    for (const br in families[f1]) {
      cleanFamilies[f1][br] = {};
      for (const f2 in families[f1][br]) {
        cleanFamilies[f1][br][f2] = Array.from(families[f1][br][f2]).sort();
      }
    }
  }

  const familyNames = Object.keys(cleanFamilies);
  console.log(`\n📂 ${familyNames.length} familias:`);
  familyNames.forEach(f => {
    const brands = Object.keys(cleanFamilies[f]).length;
    let totalSub = 0;
    Object.values(cleanFamilies[f]).forEach(br => {
      totalSub += Object.keys(br).length;
    });
    console.log(`   └─ ${f}: ${brands} marcas, ${totalSub} subfamilias`);
  });

  // Obtener token
  console.log('\n🔐 Obteniendo token...');
  const token = await getAccessToken();
  console.log('✅ Token obtenido');

  // Guardar metadata resumen
  console.log('\n💾 Guardando metadata resumen...');
  const metaUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_metadata/hierarchy`;
  const metaFields = {
    totalProducts: { integerValue: String(totalProducts) },
    totalFamilies: { integerValue: String(familyNames.length) },
    families: { arrayValue: { values: familyNames.map(f => ({ stringValue: f })) } },
    updatedAt: { timestampValue: new Date().toISOString() }
  };

  try {
    const metaResp = await fetch(metaUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: metaFields })
    });
    if (metaResp.ok) console.log('   ✅ Metadata guardada');
    else console.log(`   ⚠️  Metadata: ${metaResp.status}`);
  } catch (e) {
    console.log(`   ⚠️  Metadata error: ${e.message}`);
  }

  // Guardar cada familia como documento separado
  console.log('\n💾 Guardando árboles de familias (1 doc cada una)...');
  let successCount = 0;
  for (const famName of familyNames) {
    const ok = await saveFamilyToFirestore(token, famName, cleanFamilies[famName]);
    if (ok) successCount++;
    await new Promise(r => setTimeout(r, 15000)); // 15s entre familias
  }

  console.log(`\n🎉 ${successCount}/${familyNames.length} familias guardadas`);
  console.log('📋 Total productos: ' + totalProducts.toLocaleString());
  console.log('\n📋 Para leer en la app:');
  console.log('   catalog_tree/{familia}.data → JSON.parse()');
}

main().catch(console.error);
