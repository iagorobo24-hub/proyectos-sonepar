import { useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

/* Información estática de cada herramienta — se muestra según la ruta activa */
const TOOL_INFO = {
  '/fichas': {
    nombre: 'Fichas Técnicas',
    descripcion: 'Genera fichas técnicas detalladas de productos Sonepar con comparativa y análisis IA.',
    datos: ['Catálogo Schneider Electric', 'Comparativa de productos', 'Export PDF'],
  },
  '/almacen': {
    nombre: 'Simulador Almacén',
    descripcion: 'Simula el ciclo completo de almacén: recepción, picking y expedición con cronómetro.',
    datos: ['Ciclo completo', 'Registro de incidencias', 'Cronómetro en tiempo real'],
  },
  '/incidencias': {
    nombre: 'Dashboard Incidencias',
    descripcion: 'Registro y diagnóstico IA de fallos en equipos industriales.',
    datos: ['Diagnóstico automático', 'Historial de fallos', 'Prioridad por severidad'],
  },
  '/kpi': {
    nombre: 'KPI Logístico',
    descripcion: 'Calcula 6 KPIs logísticos clave con semáforo de estado e informe ejecutivo IA.',
    datos: ['6 KPIs logísticos', 'Semáforo de estado', 'Informe ejecutivo IA'],
  },
  '/presupuestos': {
    nombre: 'Presupuestos',
    descripcion: 'Genera presupuestos editables con catálogo Sonepar y exportación a PDF.',
    datos: ['Catálogo integrado', 'Edición en línea', 'Export PDF'],
  },
  '/formacion': {
    nombre: 'Formación Interna',
    descripcion: 'Tracker de formación por empleado con matriz de competencias y plan IA.',
    datos: ['Matriz de competencias', 'Plan personalizado IA', 'Seguimiento por empleado'],
  },
  '/sonex': {
    nombre: 'Sonex',
    descripcion: 'Chatbot técnico especializado con streaming visual, múltiples modos y exportación.',
    datos: ['Streaming en tiempo real', 'Modos especializados', 'Historial exportable'],
  },
}

/* Sidebar — muestra información de la herramienta activa según la ruta actual */
export default function Sidebar() {
  const { pathname } = useLocation()
  const info = TOOL_INFO[pathname] || TOOL_INFO['/fichas']

  return (
    <aside className={styles.sidebar}>
      {/* Nombre de la herramienta activa */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Herramienta activa</p>
        <p className={styles.toolNombre}>{info.nombre}</p>
        <p className={styles.toolDescripcion}>{info.descripcion}</p>
      </div>

      {/* Características clave */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Características</p>
        <ul className={styles.datosList}>
          {info.datos.map(dato => (
            <li key={dato} className={styles.datosItem}>{dato}</li>
          ))}
        </ul>
      </div>

      {/* Footer con info del proyecto */}
      <div className={styles.footer}>
        <p className={styles.footerText}>Sonepar España · A Coruña</p>
        <p className={styles.footerText}>PFC CFGS · 2026</p>
      </div>
    </aside>
  )
}
