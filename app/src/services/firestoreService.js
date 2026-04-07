/**
 * Servicio de Firestore para SoneparTools
 * Capa de abstracción para operaciones CRUD en Firestore
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { userDoc, userProfile } from '../config/firestorePaths';

/**
 * Guarda o actualiza un documento en Firestore
 * @param {string} uid - ID del usuario autenticado
 * @param {string} collectionPath - Ruta de la colección (ej: 'fichas/history')
 * @param {any} data - Datos a guardar
 * @param {string} docId - ID del documento (opcional, si no se proporciona se usa 'default')
 */
export async function saveUserDoc(uid, collectionPath, data, docId = 'default') {
  try {
    const docRef = doc(db, `users/${uid}/${collectionPath}`, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

/**
 * Obtiene un documento de Firestore
 * @param {string} uid - ID del usuario autenticado
 * @param {string} collectionPath - Ruta de la colección
 * @param {string} docId - ID del documento
 * @returns {Promise<any|null>} - Datos del documento o null si no existe
 */
export async function getUserDoc(uid, collectionPath, docId = 'default') {
  try {
    const docRef = doc(db, `users/${uid}/${collectionPath}`, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting from Firestore:', error);
    throw error;
  }
}

/**
 * Suscribe a cambios en tiempo real en un documento
 * @param {string} uid - ID del usuario autenticado
 * @param {string} collectionPath - Ruta de la colección
 * @param {Function} callback - Función a llamar con los datos actualizados
 * @param {string} docId - ID del documento
 * @returns {Function} - Función para cancelar la suscripción
 */
export function subscribeToUserDoc(uid, collectionPath, callback, docId = 'default') {
  try {
    const docRef = doc(db, `users/${uid}/${collectionPath}`, docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in Firestore subscription:', error);
      callback(null);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to Firestore:', error);
    return () => {};
  }
}

/**
 * Obtiene una colección ordenada y limitada
 * @param {string} uid - ID del usuario autenticado
 * @param {string} collectionPath - Ruta de la colección
 * @param {string} orderByField - Campo por el que ordenar
 * @param {number} limitCount - Número máximo de documentos
 * @returns {Promise<Array>} - Array de documentos
 */
export async function getUserCollection(uid, collectionPath, orderByField = 'updatedAt', limitCount = 50) {
  try {
    const colRef = collection(db, `users/${uid}/${collectionPath}`);
    const q = query(colRef, orderBy(orderByField, 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting collection from Firestore:', error);
    return [];
  }
}

/**
 * Elimina un documento de Firestore
 * @param {string} uid - ID del usuario autenticado
 * @param {string} collectionPath - Ruta de la colección
 * @param {string} docId - ID del documento
 */
export async function deleteUserDoc(uid, collectionPath, docId = 'default') {
  try {
    const docRef = doc(db, `users/${uid}/${collectionPath}`, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting from Firestore:', error);
    throw error;
  }
}

/**
 * Actualiza el timestamp de migración en el perfil del usuario
 * @param {string} uid - ID del usuario autenticado
 */
export async function markMigrationComplete(uid) {
  try {
    const profileRef = doc(db, userProfile(uid));
    await setDoc(profileRef, {
      migratedAt: serverTimestamp(),
      migrationVersion: '1.0.0',
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error marking migration complete:', error);
    return false;
  }
}

/**
 * Verifica si el usuario ya ha sido migrado
 * @param {string} uid - ID del usuario autenticado
 * @returns {Promise<boolean>}
 */
export async function isUserMigrated(uid) {
  try {
    const profileRef = doc(db, userProfile(uid));
    const docSnap = await getDoc(profileRef);
    if (docSnap.exists()) {
      return !!docSnap.data().migratedAt;
    }
    return false;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migra datos desde localStorage a Firestore
 * @param {string} uid - ID del usuario autenticado
 * @param {Object} localStorageData - Objeto con las keys de localStorage y sus valores
 * @returns {Promise<Object>} - Resultado de la migración
 */
export async function migrateLocalStorageToFirestore(uid, localStorageData) {
  const results = {
    success: [],
    failed: [],
    total: 0,
  };

  for (const [key, value] of Object.entries(localStorageData)) {
    results.total++;
    try {
      let parsedValue;
      try {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        parsedValue = value;
      }

      // Determinar la ruta según la key
      let collectionPath, docId;
      
      if (key === 'sonepar_fichas_historial') {
        collectionPath = 'fichas/history';
        docId = 'default';
      } else if (key === 'sonepar_presupuestos_historial') {
        collectionPath = 'budgets';
        docId = 'default';
      } else if (key === 'sonepar_incidencias') {
        collectionPath = 'incidents';
        docId = 'default';
      } else if (key === 'sonepar_kpi_historial') {
        collectionPath = 'kpi/entries';
        docId = 'default';
      } else if (key.startsWith('sonepar_sim_')) {
        collectionPath = 'simulator';
        docId = key.replace('sonepar_sim_', '');
      } else if (key.startsWith('sonepar_formacion_')) {
        collectionPath = 'training';
        docId = key.replace('sonepar_formacion_', '');
      } else if (key === 'sonepar_theme') {
        collectionPath = 'preferences';
        docId = 'theme';
      } else if (key === 'sidebar_collapsed') {
        collectionPath = 'preferences';
        docId = 'sidebar';
      } else {
        results.failed.push({ key, reason: 'Unknown key mapping' });
        continue;
      }

      await saveUserDoc(uid, collectionPath, { data: parsedValue, sourceKey: key }, docId);
      results.success.push(key);
    } catch (error) {
      results.failed.push({ key, error: error.message });
    }
  }

  // Marcar migración como completada
  if (results.success.length > 0) {
    await markMigrationComplete(uid);
  }

  return results;
}

export default {
  saveUserDoc,
  getUserDoc,
  subscribeToUserDoc,
  getUserCollection,
  deleteUserDoc,
  markMigrationComplete,
  isUserMigrated,
  migrateLocalStorageToFirestore,
};
