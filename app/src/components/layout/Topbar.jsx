import { NavLink } from 'react-router-dom'
import styles from './Topbar.module.css'

/* Herramientas de la suite con su ruta y nombre */
const TOOLS = [
  { path: '/fichas',       label: 'Fichas Técnicas' },
  { path: '/almacen',      label: 'Almacén' },
  { path: '/incidencias',  label: 'Incidencias' },
  { path: '/kpi',          label: 'KPI' },
  { path: '/presupuestos', label: 'Presupuestos' },
  { path: '/formacion',    label: 'Formación' },
  { path: '/sonex',        label: 'Sonex' },
]

/* Topbar — barra superior con logo y navegación real entre herramientas */
export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        <span className={styles.logoMarca}>Sonepar</span>
        <span className={styles.logoSuite}>Tools</span>
      </div>
      <nav className={styles.nav}>
        {TOOLS.map(tool => (
          <NavLink
            key={tool.path}
            to={tool.path}
            className={({ isActive }) =>
              isActive
                ? `${styles.navItem} ${styles.navItemActive}` 
                : styles.navItem
            }
          >
            {tool.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
