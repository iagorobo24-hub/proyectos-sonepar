# Sonepar Tools — Progreso del Rediseño

## Estado actual
- **Fase activa:** F2 — Componentes UI Base
- **Última sesión:** 15/03/2026

## Fases completadas

### ✅ F1 — Fundamentos (completada 15/03/2026)
- F1.1 — Dependencias instaladas (react-router-dom, lucide-react), IBM Plex Sans, variables.css
- F1.2 — AppShell, Topbar y Sidebar creados con CSS Modules
- F1.3 — Router configurado, 7 rutas, vercel.json
- F1.4 — Tipografía IBM Plex global, reset index.css

## Fases pendientes
- F2 — Componentes UI Base
- F3 — Refactorización FichasTecnicas
- F4 — Resto de herramientas
- F5 — Responsive, pulido y revisión PFC

## Decisiones que se apartaron del plan original
- **Sidebar dinámico adelantado a F1:** El plan original dejaba el sidebar
  como placeholder hasta F4. Se decidió adelantar la info dinámica por ruta
  (nombre + descripción + características de cada herramienta) al final de F1
  porque el sidebar estático no aportaba valor visual.

## Problemas conocidos
- Las herramientas todavía tienen sus estilos originales (se resuelve en F3 y F4)
- El contenido de las herramientas no ocupa el ancho completo (se resuelve en F3 y F4)

## Notas técnicas
- API key de Anthropic: variable de entorno VITE_ANTHROPIC_API_KEY en Vercel
- Rama de trabajo actual: rediseno-fase1
- Deploy: proyectos-sonepar.vercel.app