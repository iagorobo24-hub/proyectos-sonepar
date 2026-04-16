import { useLocation } from 'react-router-dom'
import {
  FileText, Warehouse, ShieldAlert, TrendingUp,
  Euro, GraduationCap, Bot
} from 'lucide-react'
import styles from './Sidebar.module.css'

/* Configuración de cada herramienta — icono, descripción y consejo de uso */
const TOOLS = {
  '/fichas': {
    icon: FileText,
    nombre: 'Fichas Técnicas',
    descripcion: 'Escribe el nombre, referencia o descripción de cualquier producto del catálogo Sonepar. La IA genera una ficha técnica completa con características, aplicaciones, compatibilidades y consejo de instalación.',
    consejo: 'Útil para dar respuesta rápida al técnico de mostrador.',
  },
  '/almacen': {
    icon: Warehouse,
    nombre: 'Simulador Almacén',
    descripcion: 'Reproduce el ciclo completo de un pedido — recepción, ubicación, picking, verificación y expedición — con cronómetro real. Se presentan incidencias reales durante el proceso.',
    consejo: 'Al terminar, la IA analiza el rendimiento por etapa.',
  },
  '/incidencias': {
    icon: ShieldAlert,
    nombre: 'Dashboard Incidencias',
    descripcion: 'Registra fallos en equipos industriales con zona, severidad y síntoma. La IA genera un diagnóstico automático con causa probable, solución y pasos de verificación.',
    consejo: 'El dashboard muestra KPIs en tiempo real y tabla filtrable.',
  },
  '/kpi': {
    icon: TrendingUp,
    nombre: 'KPI Logístico',
    descripcion: 'Introduce los datos del turno y la herramienta calcula 6 KPIs logísticos clave: pedidos/hora, error de picking, tiempo de ciclo, ocupación, devoluciones y productividad.',
    consejo: 'Semáforo de estado e informe ejecutivo generado por IA.',
  },
  '/presupuestos': {
    icon: Euro,
    nombre: 'Presupuestos',
    descripcion: 'Selecciona la categoría de instalación, introduce los parámetros técnicos y la IA genera un presupuesto detallado con referencias del catálogo Sonepar.',
    consejo: 'Editable línea a línea y exportable a PDF.',
  },
  '/formacion': {
    icon: GraduationCap,
    nombre: 'Formación Interna',
    descripcion: 'Gestiona la formación del equipo por empleado. Matriz de competencias visual, registro de módulos completados y plan de formación personalizado generado por IA.',
    consejo: 'Plan adaptado al perfil y nivel de cada trabajador.',
  },
  '/sonex': {
    icon: Bot,
    nombre: 'Sonex',
    descripcion: 'Chatbot técnico especializado en material eléctrico e industrial. Responde consultas técnicas, ayuda a seleccionar productos y genera documentación de apoyo.',
    consejo: 'Historial exportable y múltiples modos de consulta.',
  },
}

/* Sidebar — icono grande + descripción y consejo de la herramienta activa */
export default function Sidebar({ collapsed = false }) {
  const { pathname } = useLocation()
  const tool = TOOLS[pathname] || TOOLS['/fichas']
  const Icon = tool.icon

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
