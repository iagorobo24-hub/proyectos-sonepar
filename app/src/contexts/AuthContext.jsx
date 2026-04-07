import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase/firebaseConfig'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verificar y ejecutar migración si es necesario
        await checkAndMigrateUserData(firebaseUser.uid)
      }
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [mockUser])

  /* Función para verificar y migrar datos de localStorage a Firestore */
  async function checkAndMigrateUserData(uid) {
    try {
      // Verificar si ya está migrado
      const profileRef = doc(db, `users/${uid}/profile`)
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists() && profileSnap.data().migratedAt) {
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
        await setDoc(profileRef, { migratedAt: serverTimestamp() }, { merge: true })
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

        // Determinar ruta según la key
        let collectionPath, docId
        if (key === 'sonepar_fichas_historial') {
          collectionPath = 'fichas/history'
          docId = 'default'
        } else if (key === 'sonepar_presupuestos_historial') {
          collectionPath = 'budgets'
          docId = 'default'
        } else if (key === 'sonepar_incidencias') {
          collectionPath = 'incidents'
          docId = 'default'
        } else if (key === 'sonepar_kpi_historial') {
          collectionPath = 'kpi/entries'
          docId = 'default'
        } else if (key.startsWith('sonepar_sim_')) {
          collectionPath = 'simulator'
          docId = key.replace('sonepar_sim_', '')
        } else if (key.startsWith('sonepar_formacion_')) {
          collectionPath = 'training'
          docId = key.replace('sonepar_formacion_', '')
        } else if (key === 'sonepar_theme') {
          collectionPath = 'preferences'
          docId = 'theme'
        } else if (key === 'sidebar_collapsed') {
          collectionPath = 'preferences'
          docId = 'sidebar'
        } else {
          continue
        }

        // Guardar en Firestore
        const docRef = doc(db, `users/${uid}/${collectionPath}`, docId)
        await setDoc(docRef, { 
          data: parsedValue, 
          sourceKey: key,
          migratedAt: serverTimestamp()
        }, { merge: true })
      }

      // Marcar migración completada
      await setDoc(profileRef, { migratedAt: serverTimestamp() }, { merge: true })
      
    } catch (error) {
      console.error('Error during migration:', error)
    }
  }

  /* Login con Google */
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  /* Logout — limpia tanto Firebase como mock */
  async function logout() {
    if (mockUser) {
      setUser(null)
      try { delete window.__PW_MOCK_USER__ } catch {}
      return
    }
    await signOut(auth)
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
