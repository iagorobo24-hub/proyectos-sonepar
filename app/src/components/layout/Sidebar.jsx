import { useLocation, useNavigate } from 'react-router-dom'
import {
  FileText, Warehouse, ShieldAlert, TrendingUp,
  Euro, GraduationCap, Bot
} from 'lucide-react'
import styles from './Sidebar.module.css'

/* Configuración de cada herramienta — icono, accesos rápidos contextuales */
const TOOLS = {
  '/fichas': {
    icon: FileText,
    nombre: 'Fichas Técnicas',
    accesos: [
      { label: 'Variador ATV320 2.2kW', query: 'Variador ATV320 2.2kW monofásico' },
      { label: 'Contactor LC1D40 220V', query: 'Contactor LC1D40 bobina 220V' },
      { label: 'Sensor inductivo IF5932', query: 'Sensor inductivo IF5932 M12' },
      { label: 'PLC Modicon M241', query: 'PLC Modicon M241 24E/S' },
      { label: 'Guardamotor GV2ME10', query: 'Guardamotor GV2ME10 4-6.3A' },
    ],
  },
  '/almacen': {
    icon: Warehouse,
    nombre: 'Simulador Almacén',
    accesos: [
      { label: 'Variador — Intermedio', query: null },
      { label: 'Contactor — Básico', query: null },
      { label: 'PLC — Avanzado', query: null },
    ],
  },
  '/incidencias': {
    icon: ShieldAlert,
    nombre: 'Incidencias',
    accesos: [
      { label: 'Nueva incidencia', query: null },
      { label: 'Ver críticas activas', query: null },
      { label: 'Ver historial', query: null },
    ],
  },
  '/kpi': {
    icon: TrendingUp,
    nombre: 'KPI Logístico',
    accesos: [
      { label: 'Cargar datos de ejemplo', query: null },
      { label: '6 KPIs logísticos', query: null },
      { label: 'Informe ejecutivo IA', query: null },
    ],
  },
  '/presupuestos': {
    icon: Euro,
    nombre: 'Presupuestos',
    accesos: [
      { label: 'Instalación eléctrica', query: null },
      { label: 'Automatización industrial', query: null },
      { label: 'Protección de motores', query: null },
    ],
  },
  '/formacion': {
    icon: GraduationCap,
    nombre: 'Formación Interna',
    accesos: [
      { label: 'Ver matriz completa', query: null },
      { label: 'Plan IA por empleado', query: null },
      { label: 'Añadir empleado', query: null },
    ],
  },
  '/sonex': {
    icon: Bot,
    nombre: 'Sonex',
    accesos: [
      { label: 'Modo técnico', query: null },
      { label: 'Modo presupuesto', query: null },
      { label: 'Nueva conversación', query: null },
    ],
  },
}

/* Sidebar — icono grande de herramienta activa + accesos contextuales */
export default function Sidebar({ collapsed = false }) {
  const { pathname } = useLocation()
  const tool = TOOLS[pathname] || TOOLS['/fichas']
  const Icon = tool.icon

  return (
    <aside className={styles.sidebar}>

      {/* Icono grande de la herramienta activa */}
      <div className={`${styles.iconSection} ${collapsed ? styles.iconSectionCollapsed : ''}`}>
        <div className={styles.iconWrap} title={tool.nombre}>
          <Icon size={collapsed ? 22 : 28} strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <p className={styles.toolNombre}>{tool.nombre}</p>
        )}
      </div>

      {/* Accesos rápidos contextuales — ocultos cuando está colapsado */}
      {!collapsed && (
        <div className={styles.accesosSection}>
          <p className={styles.sectionLabel}>Accesos rápidos</p>
          {tool.accesos.map((acceso, i) => (
            <div key={i} className={styles.accesoItem}>
              <span className={styles.accesoLabel}>{acceso.label}</span>
            </div>
          ))}
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
