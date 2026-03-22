import { NavLink } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
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
  const { dark, toggle } = useTheme()
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
      <button
        onClick={toggle}
        title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          background: dark ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)',
          border: dark ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: dark ? '#f59e0b' : '#9ca3af',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '12px' }}>{dark ? '☀' : '◐'}</span>
        <span>{dark ? 'Claro' : 'Oscuro'}</span>
      </button>
    </header>
  )
}
