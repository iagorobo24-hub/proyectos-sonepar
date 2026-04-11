import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { LogOut, Menu, X } from 'lucide-react'
import styles from './Topbar.module.css'

/* Extrae las iniciales de un nombre o email */
function getUserInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/[\s._-]+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/* Herramientas de la suite con su ruta y nombre */
const TOOLS = [
  { path: '/app/fichas',       label: 'Fichas Técnicas' },
  { path: '/app/almacen',      label: 'Almacén' },
  { path: '/app/incidencias',  label: 'Incidencias' },
  { path: '/app/kpi',          label: 'KPI' },
  { path: '/app/presupuestos', label: 'Presupuestos' },
  { path: '/app/formacion',    label: 'Formación' },
  { path: '/app/sonex',        label: 'Sonex' },
]

/* Topbar — barra superior con logo, navegación, usuario y logout */
export default function Topbar() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleMenuToggle() {
    setMenuOpen(v => !v)
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      toast.show('Error al cerrar sesión', 'error')
    }
  }

  /* Cerrar dropdown con tecla Escape */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [menuOpen])

  return (
    <header className={styles.topbar}>
      {/* Botón hamburguesa — solo visible en tablet/mobile */}
      <button
        className={styles.menuBtn}
        onClick={handleMenuToggle}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label="Menú de navegación"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={styles.logo}>
        <span className={styles.logoMarca}>Sonepar</span>
        <span className={styles.logoSuite}>Tools</span>
      </div>

      {/* Navegación inline — visible solo en desktop */}
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

      {/* Menú dropdown — visible solo en tablet/mobile cuando está abierto */}
      {menuOpen && (
        <nav className={styles.dropdown} role="navigation" aria-label="Navegación principal">
          {TOOLS.map(tool => (
            <NavLink
              key={tool.path}
              to={tool.path}
              className={({ isActive }) =>
                isActive
                  ? `${styles.dropdownItem} ${styles.dropdownItemActive}`
                  : styles.dropdownItem
              }
              onClick={handleNavClick}
            >
              {tool.label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className={styles.rightSection}>
        {/* Toggle tema */}
        <button
          onClick={toggle}
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className={`${styles.themeToggle} ${dark ? styles.themeToggleDark : ''}`}
        >
          <span style={{ fontSize: '12px' }}>{dark ? '☀' : '◐'}</span>
          <span>{dark ? 'Claro' : 'Oscuro'}</span>
        </button>

        {/* Avatar + nombre del usuario + logout */}
        {user && (
          <>
            <div className={styles.userInfo}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className={`${styles.userAvatar} ${dark ? styles.userAvatarDark : ''}`}
                />
              ) : (
                <span
                  className={`${styles.userInitials} ${dark ? styles.userInitialsDark : ''}`}
                  title={user.displayName || user.email}
                >
                  {getUserInitials(user.displayName || user.email)}
                </span>
              )}
              <span
                className={`${styles.userName} ${dark ? styles.userNameDark : ''}`}
                title={user.displayName || user.email}
              >
                {user.displayName || user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className={`${styles.logoutBtn} ${dark ? styles.logoutBtnDark : ''}`}
            >
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>

      {/* Overlay para cerrar menú al hacer clic fuera */}
      {menuOpen && (
        <div className={styles.overlay} onClick={handleMenuToggle} />
      )}
    </header>
  )
}
