import { useEffect } from 'react'

/* Hook que actualiza el title de la pestaña del navegador según la ruta activa */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Sonepar Tools` : 'Sonepar Tools'
    return () => { document.title = 'Sonepar Tools' }
  }, [title])
}
