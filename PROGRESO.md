# Sonepar Tools — Progreso del Rediseño

## Estado actual
- **Fase activa:** COMPLETADO — Plan Maestro v2.0.0
- **Última sesión:** 22/03/2026

## Fases completadas

### ✅ F1 — Fundamentos (completada 15/03/2026)
- F1.1 — Dependencias instaladas (react-router-dom, lucide-react), IBM Plex Sans, variables.css
- F1.2 — AppShell, Topbar y Sidebar creados con CSS Modules
- F1.3 — Router configurado, 7 rutas, vercel.json
- F1.4 — Tipografía IBM Plex global, reset index.css

### ✅ F2 — Componentes UI Base (completada 16/03/2026)
- Botones, inputs, badges con CSS Modules
- Sistema de colores y tipografía consistente
- Componentes reutilizables en todas las herramientas

### ✅ F3 — Refactorización FichasTecnicas (completada 17/03/2026)
- Integración con catálogo unificado
- Navegación desde SONEX con URL params
- Botón "→ Presupuesto" con flujo completo

### ✅ F4 — Resto de herramientas (completada 18/03/2026)
- Todas las herramientas con UI consistente
- Sidebar dinámico con iconos lucide-react
- Eliminación de componente UITest

### ✅ F5 — Responsive, pulido y revisión PFC (completada 22/03/2026)
- Indicador de carga en SONEX
- procesarMarkdown para respuestas IA
- README.md actualizado y v2.0.0 taggeada

## Decisiones que se apartaron del plan original
- **Sidebar dinámico adelantado a F1:** El plan original dejaba el sidebar
  como placeholder hasta F4. Se decidió adelantar la info dinámica por ruta
  (nombre + descripción + características de cada herramienta) al final de F1
  porque el sidebar estático no aportaba valor visual.

## Problemas resueltos
- Estilos originales de herramientas actualizados a diseño consistente (resuelto en F3-F4)
- Contenido de herramientas ocupa ancho completo (resuelto en F3-F4)
- Catálogo duplicado unificado en src/data/catalogoSonepar.js (resuelto en F5)
- Símbolos markdown crudos en SONEX procesados (resuelto en F5)
- Sin feedback visual durante carga de IA (resuelto en F5)

## Notas técnicas
- API key de Anthropic: variable de entorno VITE_ANTHROPIC_API_KEY en Vercel
- Rama de trabajo actual: rediseno-fase1
- Deploy: proyectos-sonepar.vercel.app

## Plan Maestro completado — marzo 2026

F1, F2, F3, F4 y F5 completadas. Versión v2.0.0 taggeada en GitHub.

### Añadido post-plan
- Flujo SONEX → FichasTecnicas → Presupuestos con URL params
- Catálogo unificado 65 referencias en src/data/catalogoSonepar.js
- procesarMarkdown en SONEX — sin símbolos crudos
- Indicador "SONEX está pensando..." mientras carga
- Sidebar con iconos lucide-react + descripción contextual