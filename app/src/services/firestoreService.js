/**
 * Servicio de Firestore para SoneparTools
 * Capa de abstracción para operaciones CRUD en Firestore
 *
 * IMPORTANTE: Firestore doc() requiere número PAR de segmentos.
 * Usamos doc(db, 'col', 'doc', 'subcol', 'subdoc', ...) en lugar de
 * doc(db, 'col/doc/subcol', 'subdoc') que produce paths impares.
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

/**
 * Construye segmentos de path para doc() garantizando número par
 * Ej: buildPath('users', uid, 'fichas', 'history', 'default')
 *     → ['users', uid, 'fichas', 'history', 'default']
 *     Si es impar, añade 'default' al final
 */
function buildPath(...segments) {
  const filtered = segments.filter(Boolean)
  if (filtered.length % 2 !== 0) {
    filtered.push('default')
  }
  return filtered
}

/**
 * Guarda o actualiza un documento en Firestore
 */
export async function saveUserDoc(uid, collectionPath, data, docId = 'default') {
  try {
    const segments = buildPath('users', uid, ...collectionPath.split('/'), docId)
    const docRef = doc(db, ...segments)
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error saving to Firestore:', error)
    throw error
  }
}

/**
 * Obtiene un documento de Firestore
 */
export async function getUserDoc(uid, collectionPath, docId = 'default') {
  try {
    const segments = buildPath('users', uid, ...collectionPath.split('/'), docId)
    const docRef = doc(db, ...segments)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting from Firestore:', error)
    throw error
  }
}

/**
 * Suscribe a cambios en tiempo real en un documento
 */
export function subscribeToUserDoc(uid, collectionPath, callback, docId = 'default') {
  try {
    const segments = buildPath('users', uid, ...collectionPath.split('/'), docId)
    const docRef = doc(db, ...segments)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() })
      } else {
        callback(null)
      }
    }, (error) => {
      console.error('Error in Firestore subscription:', error)
      callback(null)
    })
    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to Firestore:', error)
    return () => {}
  }
}

/**
 * Obtiene una colección ordenada y limitada
 */
export async function getUserCollection(uid, collectionPath, orderByField = 'updatedAt', limitCount = 50) {
  try {
    const colSegments = buildPath('users', uid, ...collectionPath.split('/'))
    // collection() también necesita segmentos pares para subcolecciones
    // Tomamos todo menos el último segmento (que es el docId que añadimos)
    const pathForCollection = colSegments.slice(0, -1)
    if (pathForCollection.length === 0) return []
    const colRef = collection(db, ...pathForCollection)
    const q = query(colRef, orderBy(orderByField, 'desc'), limit(limitCount))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting collection from Firestore:', error)
    return []
  }
}

/**
 * Elimina un documento de Firestore
 */
export async function deleteUserDoc(uid, collectionPath, docId = 'default') {
  try {
    const segments = buildPath('users', uid, ...collectionPath.split('/'), docId)
    const docRef = doc(db, ...segments)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('Error deleting from Firestore:', error)
    throw error
  }
}

/**
 * Actualiza el timestamp de migración en el perfil del usuario
 */
export async function markMigrationComplete(uid) {
  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'default')
    await setDoc(profileRef, {
      migratedAt: serverTimestamp(),
      migrationVersion: '1.0.0',
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error marking migration complete:', error)
    return false
  }
}

/**
 * Verifica si el usuario ya ha sido migrado
 */
export async function isUserMigrated(uid) {
  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'default')
    const docSnap = await getDoc(profileRef)
    if (docSnap.exists()) {
      return !!docSnap.data().migratedAt
    }
    return false
  } catch (error) {
    console.error('Error checking migration status:', error)
    return false
  }
}

/**
 * Migra datos desde localStorage a Firestore
 */
export async function migrateLocalStorageToFirestore(uid, localStorageData) {
  const results = {
    success: [],
    failed: [],
    total: 0,
  }

  for (const [key, value] of Object.entries(localStorageData)) {
    results.total++
    try {
      let parsedValue
      try {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        parsedValue = value
      }

      let docRef
      if (key === 'sonepar_fichas_historial') {
        docRef = doc(db, 'users', uid, 'fichas', 'history', 'default')
      } else if (key === 'sonepar_presupuestos_historial') {
        docRef = doc(db, 'users', uid, 'budgets', 'default')
      } else if (key === 'sonepar_incidencias') {
        docRef = doc(db, 'users', uid, 'incidents', 'default')
      } else if (key === 'sonepar_kpi_historial') {
        docRef = doc(db, 'users', uid, 'kpi', 'entries', 'default')
      } else if (key.startsWith('sonepar_sim_')) {
        const simId = key.replace('sonepar_sim_', '')
        docRef = doc(db, 'users', uid, 'simulator', simId)
      } else if (key.startsWith('sonepar_formacion_')) {
        const formId = key.replace('sonepar_formacion_', '')
        docRef = doc(db, 'users', uid, 'training', formId)
      } else if (key === 'sonepar_theme') {
        docRef = doc(db, 'users', uid, 'preferences', 'theme')
      } else if (key === 'sidebar_collapsed') {
        docRef = doc(db, 'users', uid, 'preferences', 'sidebar')
      } else {
        results.failed.push({ key, reason: 'Unknown key mapping' })
        continue
      }

      await setDoc(docRef, { data: parsedValue, sourceKey: key }, { merge: true })
      results.success.push(key)
    } catch (error) {
      results.failed.push({ key, error: error.message })
    }
  }

  if (results.success.length > 0) {
    await markMigrationComplete(uid)
  }

  return results
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
}
