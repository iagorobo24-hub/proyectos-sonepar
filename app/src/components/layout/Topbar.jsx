import styles from './Topbar.module.css';

/* Herramientas de la suite con su ruta y nombre */
const TOOLS = [
  { path: '/fichas',       label: 'Fichas Técnicas' },
  { path: '/almacen',      label: 'Almacén' },
  { path: '/incidencias',  label: 'Incidencias' },
  { path: '/kpi',          label: 'KPI' },
  { path: '/presupuestos', label: 'Presupuestos' },
  { path: '/formacion',    label: 'Formación' },
  { path: '/sonex',        label: 'Sonex' },
];

/* Topbar — barra superior con logo y navegación entre herramientas */
/* Los NavLink reales se añaden en F1.3 cuando el router esté configurado */
export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        <span className={styles.logoMarca}>Sonepar</span>
        <span className={styles.logoSuite}>Tools</span>
      </div>
      <nav className={styles.nav}>
        {TOOLS.map(tool => (
          <span key={tool.path} className={styles.navItem}>
            {tool.label}
          </span>
        ))}
      </nav>
    </header>
  );
}
