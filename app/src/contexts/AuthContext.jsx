import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'

const AuthContext = createContext()

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /* Bypass auth solo en desarrollo (Playwright) */
  const mockUser = import.meta.env.DEV ? (typeof window !== 'undefined' ? window.__PW_MOCK_USER__ : null) : null

  useEffect(() => {
    /* Si hay usuario mock, usarlo directamente */
    if (mockUser) {
      setUser(mockUser)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [mockUser])

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
