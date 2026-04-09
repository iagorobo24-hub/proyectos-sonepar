/**
 * Hook personalizado para sincronización con Firestore
 * - Carga datos desde Firestore al montar
 * - Sync en tiempo real con listener
 * - Guardado con debounce
 * - Fallback a localStorage si no hay auth
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveUserDoc, 
  getUserDoc, 
  subscribeToUserDoc,
  migrateLocalStorageToFirestore 
} from '../services/firestoreService';

const DEBOUNCE_MS = 1000; // 1 segundo de debounce para guardados

/**
 * @param {string} collectionPath - Ruta de la colección en Firestore (ej: 'fichas/history')
 * @param {string} docId - ID del documento (default: 'default')
 * @param {any} initialData - Datos iniciales para usar mientras carga o si no hay auth
 * @param {string} localStorageKey - Key de localStorage para fallback (opcional)
 * @returns {{ data, loading, error, saveData, syncStatus }}
 */
export default function useFirestoreSync(collectionPath, docId = 'default', initialData = null, localStorageKey = null) {
  const { user } = useAuth();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'loading' | 'syncing' | 'saved' | 'offline'
  
  const unsubscribeRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const pendingSaveRef = useRef(null);

  // Cargar datos iniciales desde localStorage si existe la key
  const loadFromLocalStorage = useCallback(() => {
    if (!localStorageKey) return null;
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading from localStorage:', e);
    }
    return null;
  }, [localStorageKey]);

  // Guardar en localStorage como fallback
  const saveToLocalStorage = useCallback((dataToSave) => {
    if (!localStorageKey) return;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [localStorageKey]);

  // Ref para initialData — evita re-ejecutar el efecto cuando initialData es un nuevo objeto/array
  const initialDataRef = useRef(initialData);
  // Solo actualizar la ref si aún no hay datos cargados
  if (!data) {
    initialDataRef.current = initialData;
  }

  // Efecto para cargar datos al montar o cambiar usuario
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setSyncStatus('loading');
      setError(null);

      // Si no hay usuario O es un mock user (DEV only), usar localStorage como fallback
      const isMockUser = !user || (typeof window !== 'undefined' && window.__PW_MOCK_USER__);
      if (isMockUser) {
        const localData = loadFromLocalStorage();
        if (isMounted) {
          setData(localData !== null ? localData : initialDataRef.current);
          setLoading(false);
          setSyncStatus('offline');
        }
        return;
      }

      // Suscribirse a cambios en tiempo real en Firestore (SOLO users reales)
      try {
        unsubscribeRef.current = subscribeToUserDoc(
          user.uid,
          collectionPath,
          (docData) => {
            if (!isMounted) return;

            if (docData && docData.data !== undefined) {
              setData(docData.data);
              setSyncStatus('syncing');
            } else if (docData !== null) {
              setData(docData);
              setSyncStatus('syncing');
            } else {
              const localData = loadFromLocalStorage();
              setData(localData !== null ? localData : initialDataRef.current);
              setSyncStatus('offline');
            }
            setLoading(false);
          },
          docId
        );
      } catch (err) {
        console.warn('Firestore subscription failed, falling back to localStorage:', err.message);
        if (isMounted) {
          const localData = loadFromLocalStorage();
          setData(localData !== null ? localData : initialDataRef.current);
          setLoading(false);
          setSyncStatus('offline');
        }
      }
    }

    loadData();

    // Cleanup al desmontar o cambiar dependencias
    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        try { unsubscribeRef.current(); } catch {}
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.uid, collectionPath, docId, loadFromLocalStorage]);

  // Función para guardar datos con debounce
  const saveData = useCallback((dataToSave) => {
    // Actualizar estado inmediatamente para UI responsiva
    setData(dataToSave);
    setSyncStatus('syncing');

    // Guardar en localStorage como fallback inmediato
    saveToLocalStorage(dataToSave);

    // Si no hay usuario O es mock user, solo guardar en localStorage
    const isMockUser = !user || (typeof window !== 'undefined' && window.__PW_MOCK_USER__);
    if (isMockUser) {
      setSyncStatus('offline');
      return;
    }

    // Cancelar guardado pendiente anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Guardar en Firestore con debounce
    pendingSaveRef.current = dataToSave;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveUserDoc(user.uid, collectionPath, { data: pendingSaveRef.current }, docId);
        setSyncStatus('saved');
      } catch (err) {
        console.error('Error saving to Firestore:', err);
        setError(err);
        setSyncStatus('offline');
      }
    }, DEBOUNCE_MS);
  }, [user, collectionPath, docId, saveToLocalStorage]);

  // Función para migrar datos desde localStorage a Firestore
  const migrateFromLocalStorage = useCallback(async (localStorageKeys = null) => {
    if (!user || !localStorageKey) return { success: [], failed: [] };
    
    try {
      const keysToMigrate = localStorageKeys || [localStorageKey];
      const localStorageData = {};
      
      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageData[key] = value;
        }
      }

      if (Object.keys(localStorageData).length === 0) {
        return { success: [], failed: [], message: 'No data to migrate' };
      }

      const result = await migrateLocalStorageToFirestore(user.uid, localStorageData);
      
      // Limpiar keys migradas de localStorage (opcional, mantener durante 30 días)
      // for (const key of result.success) {
      //   localStorage.removeItem(key);
      // }

      return result;
    } catch (err) {
      console.error('Error migrating from localStorage:', err);
      return { success: [], failed: [{ key: 'migration', error: err.message }] };
    }
  }, [user, localStorageKey]);

  return {
    data,
    loading,
    error,
    saveData,
    syncStatus,
    migrateFromLocalStorage,
  };
}
