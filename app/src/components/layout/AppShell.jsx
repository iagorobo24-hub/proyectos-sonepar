import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import styles from './AppShell.module.css'

/* AppShell — contenedor principal con sidebar colapsable */
export default function AppShell() {
  /* Recuperar preferencia de colapso desde localStorage */
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sonepar_sidebar_collapsed') === 'true' }
    catch { return false }
  })

  /* Guardar preferencia en localStorage al cambiar */
  useEffect(() => {
    try { localStorage.setItem('sonepar_sidebar_collapsed', collapsed) }
    catch {}
  }, [collapsed])

  return (
    <div
      className={styles.shell}
      style={{ '--sidebar-w': collapsed ? '64px' : '240px' }}
    >
      {/* Topbar ocupa toda la fila superior */}
      <div className={styles.topbar}>
        <Topbar />
      </div>

      {/* Sidebar izquierdo con botón de colapso */}
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

      {/* Área principal */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}