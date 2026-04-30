# Evolución de Proyectos Sonepar — Guía Cronológica

> **Documento de referencia para el PFC.**  
> Resume cómo fue evolucionando la web app desde la idea inicial hasta el producto actual, incluyendo tecnologías usadas en cada fase, problemas encontrados y decisiones tomadas.

---

## Fase 0 — Artefactos individuales (7 mar 2026)

**Estado:** 7 herramientas como archivos `.jsx` independientes (artefactos de Claude).

Cada herramienta era un archivo autocontenido que se podía pegar en Claude.ai o en un `create-react-app`:
- `sonepar-almacen-simulador.jsx` — Simulador de flujo de almacén
- `sonepar-fichas-tecnicas.jsx` — Fichas técnicas de productos
- `sonepar-dashboard-incidencias.jsx` — Dashboard de incidencias industriales
- `sonepar-kpi-logistico.jsx` — KPI logístico con semáforo
- `sonepar-generador-presupuestos.jsx` — Generador de presupuestos
- `sonepar-formacion-interna.jsx` — Matriz de competencias y formación
- `sonepar-chatbot-tecnico.jsx` — SONEX, chatbot técnico

**Tecnologías:** React puro (JSX), CSS-in-JS inline, llamadas directas a la API de Anthropic Claude desde el frontend, `localStorage` para persistencia, `window.print()` para exportar a PDF.

**Estructura original del repo:**
```
proyectos-sonepar/
├── 01-simulador-almacen/  (carpeta por herramienta con su .jsx, README y CHANGELOG)
├── 02-fichas-tecnicas/
├── 03-dashboard-incidencias/
├── 04-kpi-logistico/
├── 05-generador-presupuestos/
├── 06-formacion-interna/
└── 07-sonex-chatbot/
```

---

## Fase 1 — Proyecto Vite + Rediseño profesional (7-15 mar 2026)

**Objetivo:** Convertir los 7 artefactos sueltos en una SPA unificada desplegable en Vercel.

**Pasos realizados:**
1. **F1.1** — Crear proyecto Vite con React 19, instalar dependencias, tipografía IBM Plex Sans, variables CSS globales
2. **F1.2** — Layout AppShell con Topbar y Sidebar
3. **F1.3** — Router (React Router DOM v7) con 7 rutas, configuración de `vercel.json`
4. **F1.4** — Reset CSS global, fuentes
5. **F1.5** — Sidebar dinámico con información contextual por herramienta

**Tecnologías añadidas:** Vite 7, React Router DOM v7, CSS Modules (reemplazando CSS-in-JS inline), lucide-react para iconos.

---

## Fase 2 — Componentes UI + Migración de herramientas (15-16 mar 2026)

**Objetivo:** Crear un sistema de componentes UI reutilizable y migrar las 7 herramientas al nuevo framework.

- **F2** — Componentes base: `Button`, `Badge`, `Input`, `Card`, `StreamIndicator`, `Toast`
- **F3** — Extracción de hooks personalizados (`useFichasTecnicas`, etc.) y componentes especializados (`TarjetaFicha`)
- **F4** — Estandarización visual con tema azul/blanco corporativo Sonepar
- **F5** — Sidebar con iconos lucide-react, accesos contextuales por herramienta

**Problema resuelto:** La API key de Anthropic estaba hardcodeada en el frontend. Se creó un proxy serverless en Vercel (`api/anthropic.js`) para ocultar la clave del lado del cliente.

---

## Fase 3 — SONEX evolución v3→v7 (8-11 mar 2026)

El chatbot SONEX fue la herramienta que más iteraciones tuvo:

| Versión | Características |
|---------|----------------|
| **v3** | Especialización Sonepar, 5 modos de consulta, system prompt completo |
| **v4** | Analytics, exportar consultas, detección de familias de producto |
| **v5** | Fix pantalla blanca (error en orden de declaraciones) |
| **v6** | Diseño corporativo Sonepar, catálogo ampliado a 80 productos |
| **v7** | Streaming de respuestas, detección automática de modo, verificador de referencias, exportar PDF |

---

## Fase 4 — Flujos inter-herramientas + Catálogo (21-22 mar 2026)

**Logro:** Conectar SONEX → Fichas Técnicas → Presupuestos mediante URL params.

- Catálogo unificado de 65 referencias reales de Sonepar
- SONEX detecta referencias en sus respuestas y ofrece botón "Ver ficha"
- Desde fichas se puede ir a presupuestos con `ADD_ITEM` (URL param)
- Procesamiento de Markdown en respuestas de SONEX

**Versión 2.0.0 etiquetada (`v2.0.0`).**

---

## Fase 5 — Modo oscuro + WelcomeState (22 mar 2026)

- Toggle de modo oscuro (ThemeContext)
- WelcomeState para cada herramienta (pantalla de bienvenida antes de usar)
- SegmentedControl como componente UI

---

## Fase 6 — Autenticación + Responsive (7 abr 2026)

**Versión 3.0.0 (`v3.0.0`):**

- **Firebase Auth** con Google Sign-In
- **Rutas protegidas** (ProtectedRoute) — toda la app requiere login
- **Menú hamburguesa responsive** (tablet + mobile)
- **Avatar** con iniciales cuando no hay foto de Google
- **Accesibilidad** ARIA en menú hamburguesa (`aria-expanded`, `aria-haspopup`, escape para cerrar)
- **Suite E2E** con Playwright — 14 tests (login, responsive en 3 breakpoints, navegación, sidebar, dark mode, performance)

**Problema encontrado:** Los tests E2E funcionaban pero se perdieron en commits posteriores (los archivos de los 14 tests ya no existen en el repo).

---

## Fase 7 — Migración a Firestore (7-8 abr 2026)

**Objetivo:** Pasar de datos locales (`catalogoSonepar.js`) a Firestore para el catálogo de productos.

- Integración con Firestore: hooks de sincronización (`useFirestoreSync`)
- Security rules por colección (usuarios, catálogo, global)
- Hardening de seguridad (CSP headers, validación de esquema)
- **Navegación jerárquica** en Fichas Técnicas: Categoría → Marca → Gama → Referencia
- Logos de marcas locales (14 marcas con logo en `/public/logos/`)

**Problemas con Firestore:**
- Límite de 50K escrituras/día en plan Spark (se creó `sync-parcial.mjs`)
- SDK a veces se quedaba colgado (se creó `sync-rest.mjs` como alternativa con REST API)
- Dificultad para buscar por nombre (se generaron keywords de búsqueda por producto)

---

## Fase 8 — Sistema de diseño circular + Catálogo masivo (8-10 abr 2026)

- **Diseño circular** completo aplicado a todas las herramientas
- Catálogo expandido: 120 → 2.864 → **75.000 productos** (scraping real de sonepar.es)
- **View Transitions API** para transición animada del tema claro/oscuro
- Fix: `flushSync` para sincronización de DOM en transiciones

**Scrapers desarrollados:**
- v11 — Usaba 1,169 combinaciones Familia+Marca
- v12 — "THE ULTIMATE HARVESTER" con interceptación de peticiones HTTP garantizada

---

## Fase 9 — Landing Page Hero (11-12 abr 2026)

Desarrollo en 3 fases de una landing page completa:

1. **Fase 1** — Mockup clickeable con screenshots de las 7 herramientas, background animado
2. **Fase 2** — CTA, Roadmap con versiones reales, Tech Stack, stats dinámicos
3. **Fase 3** — Partículas animadas, typing effect, footer, transiciones entre secciones

Componentes Hero: `AnimatedBackground`, `FeaturesMini`, `FinalCTA`, `FloatingParticles`, `HeroContainer`, `HeroContent`, `HeroHeader`, `HeroVisual`, `HowItWorks`, `Roadmap`, `SimpleFooter`, `StatsSection`, `TechStack`, `ToolsShowcase`

---

## Fase 10 — Pulido UI + Presupuestos wizard (12-13 abr 2026)

- Color brand: azul corporativo (no verde)
- Buscador en sidebar de Fichas Técnicas
- Filtros de incidencias con fondo y borde (cuadros)
- **Presupuestos:** Flujo wizard → selección de catálogo → editor con productos populares
- OAuth hecho opcional (acceso sin login obligatorio)
- Limpieza para hacer el repo público (eliminar `.env` del historial, licencia MIT)

---

## Fase 11 — Batalla de la API de IA (14-16 abr 2026)

**El problema más largo de resolver:** Conectar la app con una API de IA funcional en producción.

**Cronología de intentos:**
1. Proxy Anthropic directo (`api/anthropic.js`) — problemas de CORS
2. Cambio a `.mjs` para ESM — Vercel no lo detectaba bien
3. Vuelta a `.js` con `api/package.json` `{"type": "module"}`
4. Mover API dentro de `app/api/` — error 405
5. Mover `vercel.json` a `app/` (root del proyecto en Vercel)
6. **Solución final:** Cambio a **OpenRouter** como gateway gratuito de modelos IA

**Decisión clave:** Migrar de Anthropic API directa (de pago) a **OpenRouter** (modelos gratuitos: `anthropic/claude-3.5-haiku`, `deepseek/deepseek-r1:free`, etc.). Esto permitió un **coste 0** para la IA.

**Endpoint activo final:** `app/api/ai.js` — Gateway unificado que soporta OpenRouter, Groq y Gemini.

---

## Fase 12 — Logos de marcas (16 abr 2026)

Evolución del sistema de logos:
1. Clearbit API para logos → fondos feos, inconsistencia
2. SVGs inline → complicado de mantener
3. **Solución final:** Archivos de logo locales en `/public/logos/` + avatares con iniciales y gradientes para marcas sin logo

---

## Estado actual (Abril 2026)

**Stack:**
- React 19 + Vite 7 + React Router DOM v7
- CSS Modules + IBM Plex Sans
- Firebase Auth (Google Sign-In)
- Firestore (datos por usuario + catálogo)
- OpenRouter API (gateway IA gratuito)
- Vercel (deploy + edge functions)

**7 módulos funcionales + landing page + autenticación + modo oscuro.**

**Próximos pasos planificados:**
- Migrar catálogo de Firestore a Supabase (problemas con límites de Firestore)
- Mantener Firebase solo para OAuth
- Actualizar catálogo con datos reales completos

---

## Herramientas de IA y desarrollo usadas

| Herramienta | Tipo | Uso | Estado |
|-------------|------|-----|--------|
| **Claude (Web)** | Artefactos/Chat | Diseño inicial de 7 páginas JSX independientes | Activo |
| **VSCode** | Editor | Desarrollo local con GitHub Copilot | Activo |
| **GitHub Copilot** | IA Code Assistant | Generar versiones y documentar cambios | Agotado |
| **Vercel** | Deploy | Despliegue automático gratuito | Activo |
| **GitHub** | Version Control | Branching workflow para no romper main | Activo |
| **Windsurf** | IDE con IA | Modelos ilimitados gratuitos (tras agotar Copilot) | Activo |
| **Gemini CLI** | CLI IA | Autenticación por cuentas/auth | Activo |
| **Qwen CLI** | CLI IA | 1000 req/día gratis | Cerrado (15 abr 2026) |
| **OpenCode** | CLI IA | Modelos MiniMax, BigPickle, NVIDIA Nemotron | Activo |
| **OpenRouter** | API | Gateway API para modelos gratuitos en producción | Activo |
| **Codex (OpenAI)** | IDE con IA | Alternativa probada (generó `.codex-deploy-fix/`) | Descartado |
| **Cursor** | IDE con IA | Alternativa probada | Descartado |
| **Trae** | IDE con IA | Alternativa probada | Descartado |
| **Kiro** | IDE con IA | Alternativa probada | Descartado |
| **Antigravity** | IDE con IA | Alternativa probada | Descartado |
| **Devin (Cognition)** | IA Agente | Análisis de repo, limpieza, documentación | Activo |
| **Playwright** | Scraping/Test | Web scraping catálogo sonepar.es | Activo |
| **Firebase Auth** | Autenticación | Google Sign-In OAuth | Activo |
| **Firestore** | Base de datos | Catálogo 75K productos + datos por usuario | Activo |

---

## Lecciones aprendidas

1. **Empezar simple funciona:** Los artefactos JSX sueltos permitieron prototipar rápido sin setup.
2. **La migración a SPA es trabajo:** Pasar de 7 archivos sueltos a una app unificada requirió crear todo el scaffolding (router, layout, contexts, hooks).
3. **Firestore tiene límites duros:** El plan gratuito Spark tiene 50K escrituras/día, lo que complicó la sincronización de un catálogo de 75K productos.
4. **Las APIs de IA en producción son complejas:** CORS, configuración de Vercel, formatos de request/response, modelos deprecados... La batalla de la API duró 3 días.
5. **Los modelos gratuitos son viables:** OpenRouter ofrece acceso a modelos como Claude 3.5 Haiku sin coste, ideal para proyectos educativos.
6. **Los scrapers generan mucho código desechable:** De los 12+ scripts de scraping y sincronización, solo 1 sigue siendo útil.
7. **El diseño iterativo funciona:** SONEX pasó por 7 versiones, cada una añadiendo funcionalidad basándose en el uso real.
