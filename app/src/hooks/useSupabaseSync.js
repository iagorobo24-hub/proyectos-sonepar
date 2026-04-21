/**
 * Hook personalizado para sincronización con Supabase
 * - Carga datos desde Supabase al montar
 * - Sync en tiempo real con subscriptions
 * - Guardado con debounce
 * - Fallback a localStorage si no hay auth
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase/supabaseConfig'

const DEBOUNCE_MS = 1000 // 1 segundo de debounce para guardados

/**
 * @param {string} tableName - Nombre de la tabla en Supabase (ej: 'user_data')
 * @param {string} recordId - ID del registro (default: 'default')
 * @param {any} initialData - Datos iniciales para usar mientras carga o si no hay auth
 * @param {string} localStorageKey - Key de localStorage para fallback (opcional)
 * @returns {{ data, loading, error, saveData, syncStatus }}
 */
export default function useSupabaseSync(tableName, recordId = 'default', initialData = null, localStorageKey = null) {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'loading' | 'syncing' | 'saved' | 'offline'

  const subscriptionRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const pendingSaveRef = useRef(null)

  // Cargar datos iniciales desde localStorage si existe la key
  const loadFromLocalStorage = useCallback(() => {
    if (!localStorageKey) return null
    try {
      const stored = localStorage.getItem(localStorageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Error loading from localStorage:', e)
    }
    return null
  }, [localStorageKey])

  // Guardar en localStorage como fallback
  const saveToLocalStorage = useCallback((dataToSave) => {
    if (!localStorageKey) return
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave))
    } catch (e) {
      console.warn('Error saving to localStorage:', e)
    }
  }, [localStorageKey])

  // Ref para initialData — evita re-ejecutar el efecto cuando initialData es un nuevo objeto/array
  const initialDataRef = useRef(initialData)
  if (!data) {
    initialDataRef.current = initialData
  }

  // Obtener usuario actual de Supabase Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    getUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Efecto para cargar datos al montar o cambiar usuario
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      setSyncStatus('loading')
      setError(null)

      // Si no hay usuario, usar localStorage como fallback
      if (!user) {
        const localData = loadFromLocalStorage()
        if (isMounted) {
          setData(localData !== null ? localData : initialDataRef.current)
          setLoading(false)
          setSyncStatus('offline')
        }
        return
      }

      // Suscribirse a cambios en tiempo real en Supabase
      try {
        // Primero cargar datos iniciales
        const { data: initialData, error: fetchError } = await supabase
          .from(tableName)
          .select('data')
          .eq('user_id', user.id)
          .eq('id', recordId)
          .single()

        if (isMounted) {
          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              // No existe el registro, usar datos iniciales o localStorage
              const localData = loadFromLocalStorage()
              setData(localData !== null ? localData : initialDataRef.current)
            } else {
              throw fetchError
            }
          } else if (initialData && initialData.data !== undefined) {
            setData(initialData.data)
          } else {
            const localData = loadFromLocalStorage()
            setData(localData !== null ? localData : initialDataRef.current)
          }
          setLoading(false)
        }

        // Suscribirse a cambios en tiempo real
        subscriptionRef.current = supabase
          .channel(`${tableName}:${recordId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tableName,
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (!isMounted) return

              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const newData = payload.new.data
                if (newData !== undefined) {
                  setData(newData)
                  setSyncStatus('syncing')
                }
              }
              setLoading(false)
            }
          )
          .subscribe()

      } catch (err) {
        console.warn('Supabase subscription failed, falling back to localStorage:', err.message)
        if (isMounted) {
          const localData = loadFromLocalStorage()
          setData(localData !== null ? localData : initialDataRef.current)
          setLoading(false)
          setSyncStatus('offline')
        }
      }
    }

    loadData()

    // Cleanup al desmontar o cambiar dependencias
    return () => {
      isMounted = false
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [user?.id, tableName, recordId, loadFromLocalStorage])

  // Función para guardar datos con debounce
  const saveData = useCallback((dataToSave) => {
    // Actualizar estado inmediatamente para UI responsiva
    setData(dataToSave)
    setSyncStatus('syncing')

    // Guardar en localStorage como fallback inmediato
    saveToLocalStorage(dataToSave)

    // Si no hay usuario, solo guardar en localStorage
    if (!user) {
      setSyncStatus('offline')
      return
    }

    // Cancelar guardado pendiente anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Guardar en Supabase con debounce
    pendingSaveRef.current = dataToSave
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(
            {
              user_id: user.id,
              id: recordId,
              data: pendingSaveRef.current,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id,id'
            }
          )

        if (upsertError) throw upsertError

        setSyncStatus('saved')
      } catch (err) {
        console.error('Error saving to Supabase:', err)
        setError(err)
        setSyncStatus('offline')
      }
    }, DEBOUNCE_MS)
  }, [user, tableName, recordId, saveToLocalStorage])

  // Función para migrar datos desde localStorage a Supabase
  const migrateFromLocalStorage = useCallback(async (localStorageKeys = null) => {
    if (!user || !localStorageKey) return { success: [], failed: [] }

    try {
      const keysToMigrate = localStorageKeys || [localStorageKey]
      const localStorageData = {}

      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key)
        if (value) {
          localStorageData[key] = value
        }
      }

      if (Object.keys(localStorageData).length === 0) {
        return { success: [], failed: [], message: 'No data to migrate' }
      }

      // Migrar datos a Supabase
      const { error } = await supabase
        .from(tableName)
        .upsert({
          user_id: user.id,
          id: recordId,
          data: JSON.parse(localStorageData[localStorageKey]),
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,id'
        })

      if (error) throw error

      return { success: [localStorageKey], failed: [] }
    } catch (err) {
      console.error('Error migrating from localStorage:', err)
      return { success: [], failed: [{ key: 'migration', error: err.message }] }
    }
  }, [user, tableName, recordId, localStorageKey])

  return {
    data,
    loading,
    error,
    saveData,
    syncStatus,
    migrateFromLocalStorage,
  }
}
