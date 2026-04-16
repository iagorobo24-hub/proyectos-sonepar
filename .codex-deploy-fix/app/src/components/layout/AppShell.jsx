import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import styles from './AppShell.module.css'

/* Hook para detectar si estamos en mobile/tablet */
function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

/* AppShell — contenedor principal con sidebar colapsable */
export default function AppShell() {
  const location = useLocation()
  const isMobile = useMobile()
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sonepar_sidebar_collapsed') === 'true' }
    catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('sonepar_sidebar_collapsed', collapsed) }
    catch {}
  }, [collapsed])

  return (
    <div
      className={styles.shell}
      style={{ '--sidebar-w': collapsed ? '64px' : '240px' }}
    >
      <div className={styles.topbar}>
        <Topbar />
      </div>

      {/* Sidebar solo en desktop — en mobile/tablet no se monta */}
      {!isMobile && (
        <div className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
          <Sidebar collapsed={collapsed} />
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      )}

      <main className={styles.main}>
        {/* KEY basada en location fuerza a React a reiniciar el componente al cambiar de ruta */}
        <Outlet key={location.pathname} />
      </main>
    </div>
  )
}