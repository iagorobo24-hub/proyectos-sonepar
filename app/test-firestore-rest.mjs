/**
 * Test de conexión directo usando REST API de Firestore
 * Evita el SDK y usa fetch directo
 */
import fs from 'fs';
import crypto from 'crypto';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const PROJECT_ID = 'proyectos-sonepar';

console.log('🔌 Test directo a REST API de Firestore...\n');

// Leer service account
const sa = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

// Crear JWT para obtener token de acceso
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

  // Intercambiar JWT por access token
  const response = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function base64Url(input) {
  const encoded = typeof input === 'string' 
    ? Buffer.from(input).toString('base64')
    : input.toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function testFirestore() {
  try {
    console.log('⏳ Obteniendo access token...');
    const token = await getAccessToken();
    console.log('✅ Access token obtenido\n');

    // Test 1: Verificar API de Firestore
    console.log('⏳ Test 1: Metadata de Firestore...');
    const response1 = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response1.ok) {
      console.log('✅ Firestore API accesible');
      const data = await response1.json();
      console.log(`   Documentos: ${data.documents?.length || 0} en raíz`);
    } else {
      const error = await response1.text();
      console.log(`❌ Error: ${response1.status} - ${error}`);
    }

    // Test 2: Contar productos existentes
    console.log('\n⏳ Test 2: Leer colección catalog_products...');
    const response2 = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_products?pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response2.ok) {
      const data = await response2.json();
      const total = data.documents?.length || 0;
      console.log(`✅ Productos existentes: ${total} en esta página`);
      if (data.nextPageToken) {
        console.log('   (hay más páginas de resultados)');
      }
    } else {
      const error = await response2.text();
      console.log(`❌ Error: ${response2.status} - ${error}`);
    }

    // Test 3: Leer metadata de jerarquía
    console.log('\n⏳ Test 3: Leer jerarquía...');
    const response3 = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/catalog_metadata/hierarchy`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response3.ok) {
      const data = await response3.json();
      console.log('✅ Jerarquía encontrada');
      if (data.fields?.totalProducts?.integerValue) {
        console.log(`   Total guardado: ${data.fields.totalProducts.integerValue} productos`);
      }
    } else {
      console.log(`❌ No se encontró jerarquía: ${response3.status}`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testFirestore();
