import { useLocation } from 'react-router-dom'
import {
  FileText, Warehouse, ShieldAlert, TrendingUp,
  Euro, GraduationCap, Bot
} from 'lucide-react'
import styles from './Sidebar.module.css'
import { TOOLS_BY_PATH, normalizeToolPath } from '../../config/tools'

const ICONS = {
  FileText,
  Warehouse,
  ShieldAlert,
  TrendingUp,
  Euro,
  GraduationCap,
  Bot,
}

/* Sidebar — icono grande + descripción y consejo de la herramienta activa */
export default function Sidebar({ collapsed = false }) {
  const { pathname } = useLocation()
  const activePath = normalizeToolPath(pathname)
  const tool = TOOLS_BY_PATH[activePath] || TOOLS_BY_PATH['/fichas']
  const Icon = ICONS[tool.icon] || FileText

  return (
    <aside className={styles.sidebar}>

      {/* Icono grande de la herramienta activa */}
      <div className={`${styles.iconSection} ${collapsed ? styles.iconSectionCollapsed : ''}`}>
        <div className={styles.iconWrap} title={tool.nombre}>
          <Icon size={collapsed ? 22 : 32} strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <p className={styles.toolNombre}>{tool.nombre}</p>
        )}
      </div>

      {/* Descripción y consejo — ocultos cuando está colapsado */}
      {!collapsed && (
        <div className={styles.infoSection}>
          <p className={styles.descripcion}>{tool.descripcion}</p>
          <div className={styles.consejo}>
            <span className={styles.consejoLabel}>Consejo</span>
            <p className={styles.consejoTexto}>{tool.consejo}</p>
          </div>
        </div>
      )}

      {/* Footer — oculto cuando está colapsado */}
      {!collapsed && (
        <div className={styles.footer}>
          <p className={styles.footerText}>Sonepar España · A Coruña</p>
          <p className={styles.footerText}>PFC CFGS · 2026</p>
        </div>
      )}
    </aside>
  )
}
