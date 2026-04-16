import { createContext, useContext, useState, useEffect } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('sonepar_theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  // Sincronizar el atributo data-theme en el html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try {
      localStorage.setItem('sonepar_theme', dark ? 'dark' : 'light')
    } catch (e) {
      console.error('Error saving theme:', e)
    }
  }, [dark])

  const toggle = (event) => {
    // Si el navegador no soporta la API o prefiere reducción de movimiento, cambio simple
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDark(prev => !prev)
      return
    }

    // Calcular coordenadas del clic para que el círculo salga desde ahí
    const x = event?.clientX ?? window.innerWidth / 2
    const y = event?.clientY ?? window.innerHeight / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      // flushSync es vital aquí para que React actualice el DOM de forma síncrona
      const nextDark = !dark
      flushSync(() => {
        setDark(nextDark)
      })
      // Forzamos el atributo manualmente para que View Transitions lo vea "ahora"
      document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light')
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      
      // Animamos el pseudo-elemento correspondiente según la dirección del cambio
      // Si estamos en DARK (dark=true) y vamos a LIGHT, animamos el OLD (el que se va)
      // Si estamos en LIGHT (dark=false) y vamos a DARK, animamos el NEW (el que llega)
      document.documentElement.animate(
        {
          clipPath: dark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 400,
          easing: 'ease-in-out',
          pseudoElement: dark ? '::view-transition-old(root)' : '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
