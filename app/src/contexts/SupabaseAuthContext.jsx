import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseConfig'

const AuthContext = createContext()

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /* Bypass auth solo en desarrollo (Playwright) — NUNCA en producción */
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
  const mockUser = isDev && typeof window !== 'undefined' ? (window.__PW_MOCK_USER__ || null) : null

  useEffect(() => {
    /* Si hay usuario mock (solo DEV), usarlo directamente */
    if (mockUser) {
      // Doble verificación: rechazar en producción
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
        console.error('SECURITY: Mock user rejected in production')
      } else {
        setUser(mockUser)
        setLoading(false)
        return
      }
    }

    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await checkAndMigrateUserData(session.user.id)
      }
      setUser(session?.user || null)
      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChanged(async (_event, session) => {
      if (session?.user) {
        await checkAndMigrateUserData(session.user.id)
      }
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [mockUser])

  /* Función para verificar y migrar datos de localStorage a Supabase */
  async function checkAndMigrateUserData(userId) {
    try {
      // Verificar si ya está migrado
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('migrated_at')
        .eq('id', userId)
        .single()

      if (profile && profile.migrated_at) {
        // Ya migrado, no hacer nada
        return
      }

      // Recopilar datos de localStorage con prefijo sonepar_
      const keysToMigrate = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sonepar_') || key === 'sidebar_collapsed')) {
          keysToMigrate.push(key)
        }
      }

      if (keysToMigrate.length === 0) {
        // No hay datos que migrar, marcar como migrado
        await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            migrated_at: new Date().toISOString()
          },
          {
            onConflict: 'id'
          })
        return
      }

      // Migrar cada key
      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key)
        if (!value) continue

        let parsedValue
        try {
          parsedValue = JSON.parse(value)
        } catch {
          parsedValue = value
        }

        // Determinar tabla y ID según la key
        let tableName
        let recordId

        if (key === 'sonepar_fichas_historial') {
          tableName = 'user_fichas_history'
          recordId = 'default'
        } else if (key === 'sonepar_presupuestos_historial') {
          tableName = 'user_budgets_history'
          recordId = 'default'
        } else if (key === 'sonepar_incidencias') {
          tableName = 'user_incidents'
          recordId = 'default'
        } else if (key === 'sonepar_kpi_historial') {
          tableName = 'user_kpi_entries'
          recordId = 'default'
        } else if (key.startsWith('sonepar_sim_')) {
          tableName = 'user_simulator_data'
          recordId = key.replace('sonepar_sim_', '')
        } else if (key.startsWith('sonepar_formacion_')) {
          tableName = 'user_training_data'
          recordId = key.replace('sonepar_formacion_', '')
        } else if (key === 'sonepar_theme') {
          tableName = 'user_preferences'
          recordId = 'theme'
        } else if (key === 'sidebar_collapsed') {
          tableName = 'user_preferences'
          recordId = 'sidebar'
        } else {
          continue
        }

        // Guardar en Supabase
        await supabase
          .from(tableName)
          .upsert({
            user_id: userId,
            id: recordId,
            data: parsedValue,
            source_key: key,
            migrated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,id'
          })
      }

      // Marcar migración completada
      await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          migrated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        })

    } catch (error) {
      console.error('Error during migration:', error)
    }
  }

  /* Login con Google */
  async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('Error logging in with Google:', error)
      throw error
    }

    return data.user
  }

  /* Logout — limpia tanto Supabase como mock */
  async function logout() {
    if (mockUser) {
      setUser(null)
      try { delete window.__PW_MOCK_USER__ } catch {}
      return
    }
    await supabase.auth.signOut()
  }

  const value = { user, loading, loginWithGoogle, logout }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{
              width: '36px', height: '36px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#fbbf24',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <span>Cargando sesión…</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}
