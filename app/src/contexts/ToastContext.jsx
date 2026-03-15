import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

/* ToastProvider — envuelve la app para dar acceso al sistema de notificaciones */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((mensaje, tipo = 'info', duracion = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duracion)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

/* Hook para usar el toast desde cualquier componente */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return { toast: ctx }
}

/* Contenedor visual de los toasts */
function ToastContainer({ toasts }) {
  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

/* Item individual de toast */
function ToastItem({ toast }) {
  const colores = {
    info:    { bg: '#1f2937', color: '#ffffff' },
    success: { bg: '#065f46', color: '#ffffff' },
    error:   { bg: '#991b1b', color: '#ffffff' },
    warning: { bg: '#92400e', color: '#ffffff' },
  }
  const { bg, color } = colores[toast.tipo] || colores.info

  return (
    <div style={{
      background: bg,
      color,
      padding: '10px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: 'var(--font-sans)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '320px',
      animation: 'fadeIn 150ms ease',
    }}>
      {toast.mensaje}
    </div>
  )
}
